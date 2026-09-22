import { ProductOffer, CanonicalProduct } from '@/types/commerce';
import { MatchResult, MatchMethod } from '@/types/matching';
import { NormalizationService } from './normalization';

export class ProductMatcher {
  /**
   * 將單一 Offer 與候選的 CanonicalProducts 進行精確及模糊比對
   */
  public static matchOfferToCanonical(
    offer: ProductOffer,
    canonicalCatalog: CanonicalProduct[]
  ): MatchResult {
    // 規則 1: 配件不可與主商品合併
    if (NormalizationService.isAccessory(offer.title)) {
      return {
        isMatched: false,
        matchConfidence: 0,
        matchMethod: 'SPEC_SIMILARITY',
        matchedFields: [],
        conflictingFields: ['isAccessory'],
        requiresReview: true,
        rejectionReason: '此商品為配件，不可與主商品目錄合併。'
      };
    }

    // 依序檢查每個 CanonicalProduct
    let bestMatch: MatchResult | undefined;
    let conflict: MatchResult | undefined;
    for (const canonical of canonicalCatalog) {
      const match = this.evaluatePair(offer, canonical);
      if (match.isMatched && (!bestMatch || match.matchConfidence > bestMatch.matchConfidence)) bestMatch = match;
      if (match.conflictingFields.length && !conflict) conflict = match;
    }
    if (bestMatch) return bestMatch;
    if (conflict) return conflict;

    // 無符合之標準商品
    return {
      isMatched: false,
      matchConfidence: 0.0,
      matchMethod: 'TITLE_SIMILARITY',
      matchedFields: [],
      conflictingFields: [],
      requiresReview: false
    };
  }

  /**
   * 評估單一 Offer 與指定 CanonicalProduct 的相似度與衝突
   */
  public static evaluatePair(offer: ProductOffer, canonical: CanonicalProduct): MatchResult {
    const matchedFields: string[] = [];
    const conflictingFields: string[] = [];

    // Variant contradictions override identifiers, which may be reused or entered incorrectly.
    for (const field of ['capacity', 'size', 'packageType'] as const) {
      const expected = canonical.specifications[field];
      const actual = offer.variant?.[field];
      if (expected && actual && expected.trim().toLowerCase() !== actual.trim().toLowerCase()) {
        return {
          isMatched: false,
          matchConfidence: 0,
          matchMethod: 'BRAND_MODEL_VARIANT_EXACT',
          matchedFields: [],
          conflictingFields: [field],
          requiresReview: true,
          rejectionReason: `${field} 不同，不能自動合併`
        };
      }
    }

    // 1. GTIN / EAN / UPC / JAN 完全相同 (最高優先權)
    if (offer.gtin && canonical.gtin && offer.gtin === canonical.gtin) {
      matchedFields.push('gtin');
      return {
        canonicalProductId: canonical.id,
        isMatched: true,
        matchConfidence: 1.0,
        matchMethod: 'GTIN_EAN_UPC_JAN_EXACT',
        matchedFields,
        conflictingFields: [],
        requiresReview: false
      };
    }

    if (offer.ean && canonical.ean && offer.ean === canonical.ean) {
      matchedFields.push('ean');
      return {
        canonicalProductId: canonical.id,
        isMatched: true,
        matchConfidence: 1.0,
        matchMethod: 'GTIN_EAN_UPC_JAN_EXACT',
        matchedFields,
        conflictingFields: [],
        requiresReview: false
      };
    }

    if (offer.upc && canonical.upc && offer.upc === canonical.upc) {
      return {
        canonicalProductId: canonical.id,
        isMatched: true,
        matchConfidence: 1,
        matchMethod: 'GTIN_EAN_UPC_JAN_EXACT',
        matchedFields: ['upc'],
        conflictingFields: [],
        requiresReview: false
      };
    }

    if (offer.jan && canonical.jan && offer.jan === canonical.jan) {
      matchedFields.push('jan');
      return {
        canonicalProductId: canonical.id,
        isMatched: true,
        matchConfidence: 1.0,
        matchMethod: 'GTIN_EAN_UPC_JAN_EXACT',
        matchedFields,
        conflictingFields: [],
        requiresReview: false
      };
    }

    // 2. 品牌必須相符
    const brandMatches = offer.brand.toLowerCase() === canonical.brand.toLowerCase();
    if (!brandMatches) {
      return {
        canonicalProductId: undefined,
        isMatched: false,
        matchConfidence: 0.0,
        matchMethod: 'BRAND_MODEL_EXACT',
        matchedFields: [],
        conflictingFields: ['brand'],
        requiresReview: false
      };
    }
    matchedFields.push('brand');

    // 3. 檢查 MPN (製造商零件編號)
    if (offer.mpn && canonical.mpn) {
      // 支援前綴匹配，例如 WH1000XM5/B 與 WH1000XM5
      const offerMpn = offer.mpn.split('/')[0].trim().toUpperCase();
      const canonicalMpn = canonical.mpn.split('/')[0].trim().toUpperCase();
      if (offerMpn === canonicalMpn) {
        matchedFields.push('mpn');
        return {
          canonicalProductId: canonical.id,
          isMatched: true,
          matchConfidence: 0.98,
          matchMethod: 'BRAND_MPN_EXACT',
          matchedFields,
          conflictingFields: [],
          requiresReview: false
        };
      }
    }

    // 4. 品牌與型號完全相同
    const modelMatches = offer.model.toLowerCase() === canonical.model.toLowerCase();
    if (!modelMatches) {
      conflictingFields.push('model');
      return {
        canonicalProductId: undefined,
        isMatched: false,
        matchConfidence: 0.2,
        matchMethod: 'BRAND_MODEL_EXACT',
        matchedFields,
        conflictingFields,
        requiresReview: false
      };
    }
    matchedFields.push('model');

    // 5. 變體規則防呆：不同容量不可合併
    const canonicalCap = canonical.specifications['capacity'];
    if (canonicalCap && offer.variant.capacity && canonicalCap !== offer.variant.capacity) {
      conflictingFields.push('capacity');
      return {
        canonicalProductId: undefined,
        isMatched: false,
        matchConfidence: 0.3,
        matchMethod: 'BRAND_MODEL_VARIANT_EXACT',
        matchedFields,
        conflictingFields,
        requiresReview: false,
        rejectionReason: `容量不相符: 候選為 ${canonicalCap}，Offer 為 ${offer.variant.capacity}，禁止合併。`
      };
    }

    // 6. 變體規則防呆：不同尺寸不可合併
    const canonicalSize = canonical.specifications['size'];
    if (canonicalSize && offer.variant.size && canonicalSize !== offer.variant.size) {
      conflictingFields.push('size');
      return {
        canonicalProductId: undefined,
        isMatched: false,
        matchConfidence: 0.3,
        matchMethod: 'BRAND_MODEL_VARIANT_EXACT',
        matchedFields,
        conflictingFields,
        requiresReview: false,
        rejectionReason: `尺寸不相符: 候選為 ${canonicalSize}，Offer 為 ${offer.variant.size}，禁止合併。`
      };
    }

    // 通過型號與關鍵變體檢查
    return {
      canonicalProductId: canonical.id,
      isMatched: true,
      matchConfidence: 0.92,
      matchMethod: 'BRAND_MODEL_EXACT',
      matchedFields,
      conflictingFields,
      requiresReview: false
    };
  }
}
