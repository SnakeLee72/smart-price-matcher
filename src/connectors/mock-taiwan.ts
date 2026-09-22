import { CommerceConnector, ConnectorHealth } from './base';
import { SearchQuery, RawProduct, ProductOffer } from '@/types/commerce';
import { MOCK_PRODUCTS_DATA } from './mock-data';
import { NormalizationService } from '@/services/normalization';
import { LandedCostCalculator } from '@/services/landed-cost-calculator';

export class MockTaiwanConnector implements CommerceConnector {
  readonly source = 'mock_tw_store';
  readonly displayName = '台灣優選電商 (模擬)';
  readonly country = 'TW';
  readonly isMock = true;
  private enabled = true;

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  async search(query: SearchQuery, signal?: AbortSignal): Promise<RawProduct[]> {
    if (signal?.aborted) {
      throw new Error('Search request aborted');
    }

    const kw = (query.keyword || '').toLowerCase().trim();
    const twProducts = MOCK_PRODUCTS_DATA.filter((p) => p.source === this.source);

    if (!kw) return twProducts;

    const keywords = kw.split(/\s+/).filter(Boolean);

    return twProducts.filter((p) => {
      const targetText = `${p.title} ${p.brand || ''} ${p.model || ''} ${p.category} ${p.gtin || ''} ${p.mpn || ''}`.toLowerCase();
      // 比對關鍵字（支援多字詞）
      const matchesKeyword = keywords.every((k) => targetText.includes(k));
      if (!matchesKeyword) return false;

      // 篩選品牌
      if (query.brand && p.brand && p.brand.toLowerCase() !== query.brand.toLowerCase()) {
        return false;
      }
      // 篩選分類
      if (query.category && p.category.toLowerCase() !== query.category.toLowerCase()) {
        return false;
      }
      // 篩選價格
      // 篩選商品狀況
      if (query.condition && p.condition !== query.condition) return false;

      return true;
    });
  }

  async getProductDetail(sourceProductId: string, signal?: AbortSignal): Promise<RawProduct | null> {
    if (signal?.aborted) throw new Error('Request aborted');
    const p = MOCK_PRODUCTS_DATA.find((item) => item.source === this.source && item.sourceProductId === sourceProductId);
    return p || null;
  }

  async normalize(raw: RawProduct): Promise<ProductOffer> {
    const norm = NormalizationService.normalizeRawProduct(raw);
    const landed = LandedCostCalculator.calculate({
      itemPrice: raw.price,
      currency: raw.currency,
      category: raw.category,
      domesticShipping: raw.shippingFee,
      internationalShipping: 0,
      couponDiscount: 0,
      shipsToTaiwan: raw.shipsToTaiwan
    });

    return {
      id: `${raw.source}_${raw.sourceProductId}`,
      source: raw.source,
      sourceProductId: raw.sourceProductId,
      title: raw.title,
      normalizedTitle: norm.normalizedTitle,
      brand: norm.brand,
      model: norm.model,
      category: raw.category,
      condition: raw.condition,
      sellerName: raw.sellerName,
      sellerRating: raw.sellerRating,
      sellerReviewCount: raw.sellerReviewCount,
      imageUrl: raw.imageUrl,
      productUrl: raw.productUrl,
      currency: raw.currency,
      originalPrice: raw.originalPrice || raw.price,
      salePrice: raw.price,
      couponDiscount: 0,
      domesticShipping: raw.shippingFee,
      internationalShipping: 0,
      estimatedTax: landed.estimatedDutyTwd + landed.estimatedTaxTwd,
      serviceFee: landed.serviceFeeTwd,
      landedCost: landed,
      stockStatus: raw.stockStatus || 'IN_STOCK',
      minDeliveryDays: raw.minDeliveryDays,
      maxDeliveryDays: raw.maxDeliveryDays,
      warrantyType: raw.warrantyType,
      warrantyMonths: raw.warrantyMonths,
      returnPolicyDays: raw.returnPolicyDays,
      countryOfOrigin: raw.countryOfOrigin,
      shipsToTaiwan: raw.shipsToTaiwan,
      isOfficialStore: !!raw.isOfficialStore,
      isAuthorizedSeller: !!raw.isAuthorizedSeller,
      variant: norm.variant,
      gtin: raw.gtin,
      ean: raw.ean,
      upc: raw.upc,
      jan: raw.jan,
      mpn: raw.mpn,
      lastUpdatedAt: new Date().toISOString(),
      rawData: raw.rawAttributes,
      isMockData: true
    };
  }

  async healthCheck(): Promise<ConnectorHealth> {
    const count = MOCK_PRODUCTS_DATA.filter((p) => p.source === this.source).length;
    return {
      source: this.source,
      displayName: this.displayName,
      status: this.enabled ? 'HEALTHY' : 'DOWN',
      latencyMs: 12,
      message: this.enabled ? '台灣電商模擬連接正常 (Mock Data Active)' : '已手動停用',
      lastCheckedAt: new Date().toISOString(),
      totalProductsCount: count
    };
  }
}
