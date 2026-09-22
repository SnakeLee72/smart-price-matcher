import assert from 'assert';
import { RecommendationEngine } from '../../src/services/recommendation-engine';
import { ProductOffer } from '../../src/types/commerce';

console.log('▶ [單元測試] 推薦引擎七維度加權與真實原因產出 (RecommendationEngine)...');

const mockOffers: ProductOffer[] = [
  {
    id: 'tw-sony',
    source: 'mock_tw_store',
    sourceProductId: '1',
    title: 'Sony WH-1000XM5 黑色 台灣公司貨',
    normalizedTitle: 'Sony WH-1000XM5',
    brand: 'Sony',
    model: 'WH-1000XM5',
    category: 'Headphones',
    condition: 'BRAND_NEW',
    sellerName: '官方旗艦店',
    sellerRating: 4.95,
    sellerReviewCount: 2000,
    imageUrl: '',
    productUrl: '',
    currency: 'TWD',
    originalPrice: 11900,
    salePrice: 9900,
    couponDiscount: 0,
    domesticShipping: 0,
    internationalShipping: 0,
    estimatedTax: 0,
    serviceFee: 0,
    landedCost: {
      itemPriceTwd: 9900,
      discountTwd: 0,
      domesticShippingTwd: 0,
      internationalShippingTwd: 0,
      estimatedDutyTwd: 0,
      estimatedTaxTwd: 0,
      serviceFeeTwd: 0,
      totalTwd: 9900,
      exchangeRate: 1.0,
      exchangeRateUpdatedAt: '',
      isEstimated: false,
      missingCostFields: [],
      calculationNotes: []
    },
    stockStatus: 'IN_STOCK',
    minDeliveryDays: 1,
    maxDeliveryDays: 2,
    warrantyType: 'TAIWAN_OFFICIAL',
    warrantyMonths: 12,
    returnPolicyDays: 7,
    countryOfOrigin: 'TW',
    shipsToTaiwan: true,
    isOfficialStore: true,
    isAuthorizedSeller: true,
    variant: { color: '黑色' },
    lastUpdatedAt: '',
    rawData: {},
    isMockData: true
  },
  {
    id: 'jp-sony',
    source: 'mock_jp_store',
    sourceProductId: '2',
    title: 'Sony WH-1000XM5 日本直送',
    normalizedTitle: 'Sony WH-1000XM5',
    brand: 'Sony',
    model: 'WH-1000XM5',
    category: 'Headphones',
    condition: 'BRAND_NEW',
    sellerName: '一般日本店家',
    sellerRating: 4.20,
    sellerReviewCount: 50,
    imageUrl: '',
    productUrl: '',
    currency: 'JPY',
    originalPrice: 38000,
    salePrice: 35000,
    couponDiscount: 0,
    domesticShipping: 0,
    internationalShipping: 1500,
    estimatedTax: 400,
    serviceFee: 100,
    landedCost: {
      itemPriceTwd: 7525,
      discountTwd: 0,
      domesticShippingTwd: 0,
      internationalShippingTwd: 322,
      estimatedDutyTwd: 0,
      estimatedTaxTwd: 400,
      serviceFeeTwd: 110,
      totalTwd: 8357, // 最低到手價
      exchangeRate: 0.215,
      exchangeRateUpdatedAt: '',
      isEstimated: true,
      missingCostFields: [],
      calculationNotes: []
    },
    stockStatus: 'IN_STOCK',
    minDeliveryDays: 6,
    maxDeliveryDays: 9,
    warrantyType: 'ORIGIN_DOMESTIC',
    warrantyMonths: 12,
    returnPolicyDays: 0,
    countryOfOrigin: 'JP',
    shipsToTaiwan: true,
    isOfficialStore: false,
    isAuthorizedSeller: false,
    variant: { color: '銀色' },
    lastUpdatedAt: '',
    rawData: {},
    isMockData: true
  }
];

const results = RecommendationEngine.evaluate(mockOffers, 'BALANCED');

const twEval = results.get('tw-sony');
const jpEval = results.get('jp-sony');

assert.strictEqual(!!twEval, true);
assert.strictEqual(!!jpEval, true);

// 日本商品到手價最低，應獲得最低價標籤
assert.strictEqual(jpEval?.recommendationLabel, 'LOWEST_PRICE');

// 台灣公司貨雖價格略高，但官方保固與賣家評價滿分，應有清晰推薦理由
assert.strictEqual(twEval?.recommendationReasons.some((r) => r.includes('台灣官方原廠保固')), true);
assert.strictEqual(jpEval?.riskWarnings.some((w) => w.includes('原產國當地保固')), true);

console.log('✔ [單元測試通過] RecommendationEngine 邏輯驗證通過！');
