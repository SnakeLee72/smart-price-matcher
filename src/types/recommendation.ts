export type RecommendationMode = 
  | 'BALANCED'         // 綜合推薦 (預設)
  | 'LOWEST_PRICE'     // 最低總價模式
  | 'FASTEST_DELIVERY' // 最快到貨模式
  | 'BEST_WARRANTY'    // 最佳保固模式
  | 'TAIWAN_OFFICIAL'  // 台灣公司貨優先
  | 'TRUSTED_SELLER';  // 高評價賣家優先

export type RecommendationBadge = 
  | 'BEST_OVERALL'     // 最佳綜合推薦
  | 'LOWEST_PRICE'     // 最低總價
  | 'FASTEST_DELIVERY' // 最快到貨
  | 'BEST_WARRANTY'    // 最佳保固
  | 'OFFICIAL_AUTH'    // 官方授權/旗艦
  | 'PARALLEL_IMPORT'  // 平行輸入超值選
  | 'OVERSEAS_SPECIAL';// 日本/海外直送

export interface ScoringWeights {
  landedCost: number;     // 預設 35%
  specification: number;  // 預設 20%
  sellerTrust: number;    // 預設 15%
  warranty: number;       // 預設 10%
  delivery: number;       // 預設 10%
  condition: number;      // 預設 5%
  freshness: number;      // 預設 5%
}

export interface RecommendationScoreResult {
  offerId: string;
  overallScore: number;       // 0 - 100
  priceScore: number;         // 0 - 100
  specificationScore: number; // 0 - 100
  sellerScore: number;        // 0 - 100
  warrantyScore: number;      // 0 - 100
  deliveryScore: number;      // 0 - 100
  conditionScore: number;     // 0 - 100
  freshnessScore: number;     // 0 - 100
  recommendationLabel?: RecommendationBadge;
  recommendationReasons: string[];
  riskWarnings: string[];
}
