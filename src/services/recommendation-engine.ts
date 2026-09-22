import { ProductOffer } from '@/types/commerce';
import { RecommendationScoreResult, RecommendationMode, ScoringWeights } from '@/types/recommendation';

export class RecommendationEngine {
  // 預設綜合評分權重
  private static DEFAULT_WEIGHTS: ScoringWeights = {
    landedCost: 0.35,
    specification: 0.20,
    sellerTrust: 0.15,
    warranty: 0.10,
    delivery: 0.10,
    condition: 0.05,
    freshness: 0.05
  };

  /**
   * 根據推薦模式動態調整權重
   */
  public static getWeightsByMode(mode: RecommendationMode = 'BALANCED'): ScoringWeights {
    switch (mode) {
      case 'LOWEST_PRICE':
        return { landedCost: 0.70, specification: 0.10, sellerTrust: 0.05, warranty: 0.05, delivery: 0.05, condition: 0.03, freshness: 0.02 };
      case 'FASTEST_DELIVERY':
        return { landedCost: 0.20, specification: 0.15, sellerTrust: 0.15, warranty: 0.10, delivery: 0.35, condition: 0.03, freshness: 0.02 };
      case 'BEST_WARRANTY':
        return { landedCost: 0.15, specification: 0.15, sellerTrust: 0.15, warranty: 0.45, delivery: 0.05, condition: 0.03, freshness: 0.02 };
      case 'TAIWAN_OFFICIAL':
        return { landedCost: 0.20, specification: 0.15, sellerTrust: 0.15, warranty: 0.35, delivery: 0.10, condition: 0.03, freshness: 0.02 };
      case 'TRUSTED_SELLER':
        return { landedCost: 0.20, specification: 0.15, sellerTrust: 0.45, warranty: 0.10, delivery: 0.05, condition: 0.03, freshness: 0.02 };
      case 'BALANCED':
      default:
        return this.DEFAULT_WEIGHTS;
    }
  }

  /**
   * 針對 Offers 進行 7 維度評分計算與理由產出
   */
  public static evaluate(
    offers: ProductOffer[],
    mode: RecommendationMode = 'BALANCED',
    targetKeyword?: string
  ): Map<string, RecommendationScoreResult> {
    const results = new Map<string, RecommendationScoreResult>();
    if (offers.length === 0) return results;

    const weights = this.getWeightsByMode(mode);
    const minLandedCost = Math.min(...offers.map((o) => o.landedCost.totalTwd));
    const fastestDays = Math.min(...offers.map((o) => o.minDeliveryDays));

    for (const offer of offers) {
      const reasons: string[] = [];
      const warnings: string[] = [];

      // 1. 價格分數 (以最低到手價為 100 分，高於最低價逐步遞減)
      const priceDiffRatio = (offer.landedCost.totalTwd - minLandedCost) / Math.max(1, minLandedCost);
      const priceScore = Math.max(20, Math.round(100 - priceDiffRatio * 150));
      if (offer.landedCost.totalTwd === minLandedCost) {
        reasons.push(`全網最低總到手價 NT$ ${offer.landedCost.totalTwd.toLocaleString()}`);
      } else if (priceDiffRatio <= 0.06) {
        reasons.push(`總到手價僅比最低價高 NT$ ${(offer.landedCost.totalTwd - minLandedCost).toLocaleString()}，性價比極高`);
      }

      // 2. 規格符合度評分
      let specificationScore = 90;
      if (targetKeyword) {
        const kwLower = targetKeyword.toLowerCase();
        if (offer.model && kwLower.includes(offer.model.toLowerCase())) specificationScore += 5;
        if (offer.variant.color && kwLower.includes(offer.variant.color.toLowerCase())) specificationScore += 5;
      }
      specificationScore = Math.min(100, specificationScore);

      // 3. 賣家可信度分數 (評分與評論數加權)
      const baseRatingScore = (offer.sellerRating / 5.0) * 80;
      const reviewVolumeBonus = Math.min(20, (offer.sellerReviewCount / 100) * 2);
      const sellerScore = Math.round(Math.min(100, baseRatingScore + reviewVolumeBonus));
      if (offer.isOfficialStore) {
        reasons.push('品牌原廠官方直營旗艦店');
      } else if (offer.isAuthorizedSeller) {
        reasons.push('原廠認證授權專賣經銷商');
      }
      if (offer.sellerReviewCount < 50) {
        warnings.push('賣家評價樣本數較少，交易前建議確認店家歷史信譽');
      }

      // 4. 保固與退貨分數
      let warrantyScore = 50;
      if (offer.warrantyType === 'TAIWAN_OFFICIAL') {
        warrantyScore = 100;
        reasons.push(`提供 ${offer.warrantyMonths} 個月台灣官方原廠保固與到府收送`);
      } else if (offer.warrantyType === 'PARALLEL_IMPORT') {
        warrantyScore = 70;
        reasons.push(`提供 ${offer.warrantyMonths} 個月台灣店家代送/店保`);
        warnings.push('此為平行輸入商品，非台灣代理公司貨');
      } else if (offer.warrantyType === 'ORIGIN_DOMESTIC') {
        warrantyScore = 60;
        warnings.push(`僅享原產國當地保固 (${offer.countryOfOrigin})，在台送修需自理跨國運費`);
      } else {
        warrantyScore = 30;
        warnings.push('無原廠保固或未提供保固資訊');
      }

      // 5. 到貨天數分數
      let deliveryScore = 50;
      if (offer.minDeliveryDays <= 1) {
        deliveryScore = 100;
        reasons.push('台灣本地 24H 快速配送');
      } else if (offer.minDeliveryDays <= 3) {
        deliveryScore = 85;
      } else if (offer.minDeliveryDays <= 7) {
        deliveryScore = 65;
        reasons.push(`海外直郵約 ${offer.minDeliveryDays}-${offer.maxDeliveryDays} 工作天到貨`);
      } else {
        deliveryScore = 40;
        warnings.push(`預估運送期較長 (約 ${offer.minDeliveryDays}-${offer.maxDeliveryDays} 天)`);
      }

      // 6. 商品狀況分數
      let conditionScore = 60;
      if (offer.condition === 'BRAND_NEW') {
        conditionScore = 100;
      } else if (offer.condition === 'OPEN_BOX') {
        conditionScore = 75;
        warnings.push('此商品為拆封展示福利品');
      } else if (offer.condition === 'REFURBISHED') {
        conditionScore = 65;
        warnings.push('原廠整新機');
      } else {
        conditionScore = 50;
        warnings.push('二手商品');
      }

      // 7. 資料新鮮度分數
      const freshnessScore = 95; // 模擬時段為即時獲取

      // 其他風險檢測
      if (offer.landedCost.isEstimated) {
        warnings.push('總到手價包含預估之跨國運費或關稅，最終價格以電商結帳頁為準');
      }
      if (offer.landedCost.missingCostFields.includes('internationalShipping')) {
        warnings.push('大型物品或跨國運費尚未取得最終報價');
      }

      // 加權綜合分數計算
      const overallScore = Math.round(
        priceScore * weights.landedCost +
        specificationScore * weights.specification +
        sellerScore * weights.sellerTrust +
        warrantyScore * weights.warranty +
        deliveryScore * weights.delivery +
        conditionScore * weights.condition +
        freshnessScore * weights.freshness
      );

      results.set(offer.id, {
        offerId: offer.id,
        overallScore,
        priceScore,
        specificationScore,
        sellerScore,
        warrantyScore,
        deliveryScore,
        conditionScore,
        freshnessScore,
        recommendationReasons: reasons,
        riskWarnings: warnings
      });
    }

    // 標註最佳徽章 (Best Badges)
    let bestOverallId = '';
    let bestOverallScore = -1;
    let lowestCostId = '';
    let lowestCost = Infinity;
    let fastestDeliveryId = '';
    let minDays = Infinity;
    let bestWarrantyId = '';
    let maxWarranty = -1;

    for (const [id, res] of results.entries()) {
      const offer = offers.find((o) => o.id === id)!;
      if (res.overallScore > bestOverallScore) {
        bestOverallScore = res.overallScore;
        bestOverallId = id;
      }
      if (offer.landedCost.totalTwd < lowestCost) {
        lowestCost = offer.landedCost.totalTwd;
        lowestCostId = id;
      }
      if (offer.minDeliveryDays < minDays) {
        minDays = offer.minDeliveryDays;
        fastestDeliveryId = id;
      }
      if (res.warrantyScore > maxWarranty) {
        maxWarranty = res.warrantyScore;
        bestWarrantyId = id;
      }
    }

    if (bestOverallId) {
      const target = results.get(bestOverallId)!;
      target.recommendationLabel = 'BEST_OVERALL';
      target.recommendationReasons.unshift('此商品在價格、台灣原廠保固與賣家評價上取得最佳平衡，評定為最佳綜合推薦');
    }

    if (lowestCostId && lowestCostId !== bestOverallId) {
      const target = results.get(lowestCostId)!;
      target.recommendationLabel = 'LOWEST_PRICE';
    }

    return results;
  }
}