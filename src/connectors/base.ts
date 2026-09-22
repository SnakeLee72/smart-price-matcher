import { SearchQuery, RawProduct, ProductOffer } from '@/types/commerce';

export interface ConnectorHealth {
  source: string;
  displayName: string;
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  latencyMs: number;
  message?: string;
  lastCheckedAt: string;
  totalProductsCount?: number;
}

export interface CommerceConnector {
  readonly source: string;
  readonly displayName: string;
  readonly country: string; // 'TW', 'JP', 'US' 等
  readonly isMock: boolean;
  
  isEnabled(): boolean;
  setEnabled(enabled: boolean): void;
  
  search(query: SearchQuery, signal?: AbortSignal): Promise<RawProduct[]>;
  getProductDetail(sourceProductId: string, signal?: AbortSignal): Promise<RawProduct | null>;
  normalize(rawProduct: RawProduct): Promise<ProductOffer>;
  healthCheck(): Promise<ConnectorHealth>;
}