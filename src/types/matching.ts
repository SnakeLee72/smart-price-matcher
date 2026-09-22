export type MatchMethod = 
  | 'GTIN_EAN_UPC_JAN_EXACT'
  | 'BRAND_MPN_EXACT'
  | 'BRAND_MODEL_EXACT'
  | 'BRAND_MODEL_VARIANT_EXACT'
  | 'TITLE_SIMILARITY'
  | 'SPEC_SIMILARITY'
  | 'MANUAL_OVERRIDE';

export interface MatchResult {
  canonicalProductId?: string;
  isMatched: boolean;
  matchConfidence: number; // 0.0 - 1.0
  matchMethod: MatchMethod;
  matchedFields: string[];
  conflictingFields: string[];
  requiresReview: boolean;
  rejectionReason?: string;
}
