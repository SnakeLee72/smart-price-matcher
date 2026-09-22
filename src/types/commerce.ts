export type ProductCondition = 'BRAND_NEW' | 'OPEN_BOX' | 'REFURBISHED' | 'USED';

export type WarrantyType = 
  | 'TAIWAN_OFFICIAL'    // 台灣公司貨保固
  | 'PARALLEL_IMPORT'    // 店家保固 / 平行輸入
  | 'ORIGIN_DOMESTIC'    // 日本/原產國當地保固
  | 'NONE';              // 無保固

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'PREORDER';

export interface ProductVariant {
  color?: string;
  size?: string;
  capacity?: string;
  voltage?: string;
  plugType?: string;
  language?: string;
  region?: string;
  packageType?: string;
}

export interface RawProduct {
  source: string;
  sourceProductId: string;
  title: string;
  brand?: string;
  model?: string;
  category: string;
  price: number;
  originalPrice?: number;
  currency: string;
  imageUrl: string;
  productUrl: string;
  condition: ProductCondition;
  sellerName: string;
  sellerRating: number;
  sellerReviewCount: number;
  shipsToTaiwan: boolean;
  countryOfOrigin: string;
  shippingFee: number;
  isShippingEstimated?: boolean;
  minDeliveryDays: number;
  maxDeliveryDays: number;
  warrantyType: WarrantyType;
  warrantyMonths: number;
  returnPolicyDays: number;
  isOfficialStore?: boolean;
  isAuthorizedSeller?: boolean;
  stockStatus?: StockStatus;
  gtin?: string;
  ean?: string;
  upc?: string;
  jan?: string;
  mpn?: string;
  rawAttributes: Record<string, unknown>;
  isMockData: boolean;
}

export interface LandedCostBreakdown {
  itemPriceTwd: number;
  discountTwd: number;
  domesticShippingTwd: number;
  internationalShippingTwd: number;
  estimatedDutyTwd: number;
  estimatedTaxTwd: number;
  serviceFeeTwd: number;
  totalTwd: number;
  exchangeRate: number;
  exchangeRateUpdatedAt: string;
  isEstimated: boolean;
  missingCostFields: string[];
  calculationNotes: string[];
}

export interface ProductOffer {
  id: string;
  source: string;
  sourceProductId: string;
  canonicalProductId?: string;
  title: string;
  normalizedTitle: string;
  brand: string;
  model: string;
  category: string;
  condition: ProductCondition;
  sellerName: string;
  sellerRating: number;
  sellerReviewCount: number;
  imageUrl: string;
  productUrl: string;
  currency: string;
  originalPrice: number;
  salePrice: number;
  couponDiscount: number;
  domesticShipping: number;
  internationalShipping: number;
  estimatedTax: number;
  serviceFee: number;
  landedCost: LandedCostBreakdown;
  stockStatus: StockStatus;
  minDeliveryDays: number;
  maxDeliveryDays: number;
  warrantyType: WarrantyType;
  warrantyMonths: number;
  returnPolicyDays: number;
  countryOfOrigin: string;
  shipsToTaiwan: boolean;
  isOfficialStore: boolean;
  isAuthorizedSeller: boolean;
  variant: ProductVariant;
  gtin?: string;
  ean?: string;
  upc?: string;
  jan?: string;
  mpn?: string;
  lastUpdatedAt: string;
  rawData: Record<string, unknown>;
  isMockData: boolean;
}

export interface CanonicalProduct {
  id: string;
  brand: string;
  model: string;
  normalizedName: string;
  category: string;
  gtin?: string;
  ean?: string;
  upc?: string;
  jan?: string;
  mpn?: string;
  specifications: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  offers?: ProductOffer[];
}

export interface SearchQuery {
  keyword: string;
  brand?: string;
  model?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minShipping?: number;
  maxShipping?: number;
  condition?: ProductCondition;
  color?: string;
  size?: string;
  capacity?: string;
  specification?: string;
  voltage?: string;
  countryOfOrigin?: string;
  maxDeliveryDays?: number;
  minSellerRating?: number;
  minReturnPolicyDays?: number;
  inStock?: boolean;
  shipsToTaiwan?: boolean;
  warrantyType?: WarrantyType;
  sources?: string[];
  sortBy?: 'RECOMMENDED' | 'PRICE_ASC' | 'PRICE_DESC' | 'ORIGINAL_PRICE_ASC' | 'FASTEST_DELIVERY' | 'SELLER_RATING' | 'WARRANTY_BEST' | 'UPDATED_DESC';
  page?: number;
  pageSize?: number;
}
