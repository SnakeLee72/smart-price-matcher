import { ConnectorRegistry } from '@/connectors/registry';
import { CommerceConnector } from '@/connectors/base';
import { ProductOffer, SearchQuery } from '@/types/commerce';
import { RecommendationMode, RecommendationScoreResult } from '@/types/recommendation';
import { CacheService } from './cache';
import { ConnectorRateLimiter } from './connector-rate-limiter';
import { matchesOffer } from './offer-filter';
import { RecommendationEngine } from './recommendation-engine';
import { recordOfferPrices } from './price-history-recorder';
import { recordConnectorObservations, ConnectorObservation } from './connector-log-recorder';

export interface SearchExecutionResult {
  offers: (ProductOffer & { evaluation?: RecommendationScoreResult })[];
  totalCount: number;
  successfulSources: string[];
  failedSources: { source: string; reason: string }[];
  cached: boolean;
  searchedAt: string;
}

export class SearchOrchestrator {
  private readonly registry = ConnectorRegistry.getInstance();
  private readonly rateLimiter = new ConnectorRateLimiter();

  constructor(private readonly connectorTimeoutMs = 3500) {}

  private async searchSource(connector: CommerceConnector, query: SearchQuery): Promise<ProductOffer[]> {
    if (!this.rateLimiter.allow(connector.source)) throw new Error('RATE_LIMITED');
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        reject(new Error('TIMEOUT'));
      }, this.connectorTimeoutMs);
    });
    try {
      return await Promise.race([
        connector.search(query, controller.signal).then((products) =>
          Promise.all(products.map((product) => connector.normalize(product)))
        ),
        timeout
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  public async executeSearch(query: SearchQuery, mode: RecommendationMode = 'BALANCED'): Promise<SearchExecutionResult> {
    const connectors = this.registry.getEnabledConnectors().filter((connector) =>
      !query.sources?.length || query.sources.includes(connector.source)
    );
    // A source toggle changes the key, so disabling a source cannot serve its cached offers.
    const cacheKey = `search:${connectors.map((connector) => connector.source).join(',')}:${JSON.stringify(query)}:${mode}`;
    const cached = await CacheService.get<SearchExecutionResult>(cacheKey);
    if (cached) return { ...cached, cached: true };

    const latencies: number[] = [];
    const outcomes = await Promise.allSettled(connectors.map(async (connector, index) => {
      const startedAt = Date.now();
      try {
        return await this.searchSource(connector, query);
      } finally {
        latencies[index] = Date.now() - startedAt;
      }
    }));
    const successfulSources: string[] = [];
    const failedSources: SearchExecutionResult['failedSources'] = [];
    const offers: ProductOffer[] = [];
    outcomes.forEach((outcome, index) => {
      const source = connectors[index].source;
      if (outcome.status === 'fulfilled') {
        successfulSources.push(source);
        offers.push(...outcome.value);
      } else {
        const code = outcome.reason instanceof Error ? outcome.reason.message : '';
        failedSources.push({
          source,
          reason: code === 'TIMEOUT' ? '來源逾時' : code === 'RATE_LIMITED' ? '來源請求過於頻繁' : '來源暫時無法使用'
        });
      }
    });

    const observations: ConnectorObservation[] = outcomes.map((outcome, index) => ({
      source: connectors[index].source,
      status: outcome.status === 'fulfilled' ? 'SUCCESS' : 'FAILED',
      latencyMs: latencies[index] || 0,
      errorMessage: outcome.status === 'rejected' ? '來源暫時無法使用' : undefined
    }));
    try {
      await recordConnectorObservations(observations);
    } catch (error) {
      console.error('[Connector Log Recorder] Database unavailable', error);
    }

    try {
      await recordOfferPrices(offers);
    } catch (error) {
      console.error('[Price History Recorder] Database unavailable; search results remain available', error);
    }

    const filtered = offers.filter((offer) => matchesOffer(offer, query));
    const scores = RecommendationEngine.evaluate(filtered, mode, query.keyword);
    const evaluated = filtered.map((offer) => ({ ...offer, evaluation: scores.get(offer.id) }));
    const score = (offer: typeof evaluated[number], key: 'overallScore' | 'warrantyScore') => offer.evaluation?.[key] || 0;
    switch (query.sortBy) {
      case 'PRICE_ASC': evaluated.sort((a, b) => a.landedCost.totalTwd - b.landedCost.totalTwd); break;
      case 'PRICE_DESC': evaluated.sort((a, b) => b.landedCost.totalTwd - a.landedCost.totalTwd); break;
      case 'ORIGINAL_PRICE_ASC': evaluated.sort((a, b) => a.originalPrice * a.landedCost.exchangeRate - b.originalPrice * b.landedCost.exchangeRate); break;
      case 'FASTEST_DELIVERY': evaluated.sort((a, b) => a.minDeliveryDays - b.minDeliveryDays); break;
      case 'SELLER_RATING': evaluated.sort((a, b) => b.sellerRating - a.sellerRating); break;
      case 'WARRANTY_BEST': evaluated.sort((a, b) => score(b, 'warrantyScore') - score(a, 'warrantyScore')); break;
      case 'UPDATED_DESC': evaluated.sort((a, b) => Date.parse(b.lastUpdatedAt) - Date.parse(a.lastUpdatedAt)); break;
      default: evaluated.sort((a, b) => score(b, 'overallScore') - score(a, 'overallScore'));
    }

    const page = Math.max(1, query.page || 1);
    const pageSize = Math.min(50, Math.max(1, query.pageSize || 20));
    const result: SearchExecutionResult = {
      offers: evaluated.slice((page - 1) * pageSize, page * pageSize),
      totalCount: evaluated.length,
      successfulSources,
      failedSources,
      cached: false,
      searchedAt: new Date().toISOString()
    };
    // Transient source failures should be retried on the next search.
    if (!failedSources.length) await CacheService.set(cacheKey, result, 180);
    return result;
  }
}
