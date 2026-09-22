import { CommerceConnector, ConnectorHealth } from './base';
import { SearchQuery, RawProduct, ProductOffer } from '@/types/commerce';

/**
 * 預留之 Amazon Japan 官方電商 Connector 實作介面
 * 遵守規範：
 * 1. 優先使用 Amazon Creator API / PA-API (Product Advertising API 5.0)
 * 2. 嚴禁未經授權之 HTML 爬蟲或繞過反機器人驗證
 * 3. 憑證未提供時自動維持停用或轉為導購搜尋連結
 */
export class AmazonJapanConnector implements CommerceConnector {
  readonly source = 'amazon_jp';
  readonly displayName = 'Amazon Japan (預留)';
  readonly country = 'JP';
  readonly isMock = false;
  private enabled = false; // 預設關閉，待取得授權金鑰後由後端環境變數開啟

  isEnabled(): boolean {
    return this.enabled && !!process.env.AMAZON_PAAPI_ACCESS_KEY;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  async search(query: SearchQuery, signal?: AbortSignal): Promise<RawProduct[]> {
    if (!this.isEnabled()) {
      // TODO: 平台尚未串接正式 PA-API 金鑰，回傳空陣列或導購搜尋連結
      return [];
    }

    if (signal?.aborted) throw new Error('Search aborted');

    // TODO: 實作 Amazon PA-API 5.0 呼叫 (包含 AWS V4 簽章驗證、ItemSearch 與節流控制)
    return [];
  }

  async getProductDetail(sourceProductId: string, signal?: AbortSignal): Promise<RawProduct | null> {
    if (!this.isEnabled()) return null;
    if (signal?.aborted) throw new Error('Request aborted');
    // TODO: 透過 GetItems 取得指定 ASIN 之規格與價格
    return null;
  }

  async normalize(rawProduct: RawProduct): Promise<ProductOffer> {
    throw new Error(`Normalization not yet implemented for ${this.source}: ${rawProduct.sourceProductId}`);
  }

  async healthCheck(): Promise<ConnectorHealth> {
    const isConfigured = !!process.env.AMAZON_PAAPI_ACCESS_KEY;
    return {
      source: this.source,
      displayName: this.displayName,
      status: isConfigured ? 'HEALTHY' : 'DOWN',
      latencyMs: 0,
      message: isConfigured ? 'Amazon PA-API 憑證已配置' : '等待配置 AMAZON_PAAPI_ACCESS_KEY (預設停用)',
      lastCheckedAt: new Date().toISOString()
    };
  }
}
