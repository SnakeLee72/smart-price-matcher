import assert from 'assert';
import { LandedCostCalculator } from '../../src/services/landed-cost-calculator';

console.log('▶ [單元測試] 跨國總到手價計算 (LandedCostCalculator)...');

// 測試 1: 台灣本地商品計算 (免運、無關稅)
const twLanded = LandedCostCalculator.calculate({
  itemPrice: 9900,
  currency: 'TWD',
  category: 'Headphones',
  domesticShipping: 0,
  internationalShipping: 0,
  couponDiscount: 0,
  shipsToTaiwan: true
});

assert.strictEqual(twLanded.itemPriceTwd, 9900, '台幣商品價格應不變');
assert.strictEqual(twLanded.totalTwd, 9900, '無運費稅費時總額等於售價');
assert.strictEqual(twLanded.isEstimated, false, '本島交易無須預估關稅');

// 測試 2: 日本跨境商品換算 (匯率 0.215，超過 2000 門檻需課稅)
const jpLanded = LandedCostCalculator.calculate({
  itemPrice: 50000, // 50000 * 0.215 = 10750 TWD
  currency: 'JPY',
  category: 'Appliances', // 家電進口稅 5%
  domesticShipping: 0,
  internationalShipping: 3000, // 3000 * 0.215 = 645 TWD
  couponDiscount: 0,
  shipsToTaiwan: true
});

assert.strictEqual(jpLanded.itemPriceTwd, 10750, '日幣依 0.215 換算為 10750 TWD');
assert.strictEqual(jpLanded.internationalShippingTwd, 645, '國際運費應正確換算');
assert.strictEqual(jpLanded.estimatedDutyTwd > 0, true, '超過 2000 元應課徵關稅');
assert.strictEqual(jpLanded.estimatedTaxTwd > 0, true, '超過 2000 元應課徵 5% 營業稅');
assert.strictEqual(jpLanded.isEstimated, true, '包含海外關稅應標註為估算');
assert.strictEqual(jpLanded.totalTwd > jpLanded.itemPriceTwd, true, '總到手價應大於純商品售價');

// 測試 3: 運費未確認之商品 (應包含 missingCostFields)
const unknownShippingLanded = LandedCostCalculator.calculate({
  itemPrice: 200000,
  currency: 'JPY',
  category: 'Appliances',
  domesticShipping: 0,
  internationalShipping: 0,
  couponDiscount: 0,
  shipsToTaiwan: true,
  isShippingEstimated: true
});

assert.strictEqual(unknownShippingLanded.missingCostFields.includes('internationalShipping'), true, '未知運費應記錄在 missingCostFields 中');

console.log('✔ [單元測試通過] LandedCostCalculator 全部測項驗證通過！');
