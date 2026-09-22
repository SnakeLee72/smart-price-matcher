import assert from 'assert';
import { NormalizationService } from '../../src/services/normalization';
import { RawProduct } from '../../src/types/commerce';

console.log('▶ [單元測試] 商品名稱標準化與型號解析測試 (NormalizationService)...');

// 測試 1: 全形半形轉換
const halfWidth = NormalizationService.toHalfWidth('Ｓｏｎｙ　ＷＨ－１０００ＸＭ５（黑色）');
assert.strictEqual(halfWidth.includes('Sony'), true, '全形英文字應轉為半形');
assert.strictEqual(halfWidth.includes('WH-1000XM5'), true, '全形型號應轉為半形');

// 測試 2: 品牌別名識別
const brandSonyJp = NormalizationService.recognizeBrand('ソニー ワイヤレスノイズキャンセリングヘッドホン');
assert.strictEqual(brandSonyJp, 'Sony', '日文「ソニー」應正規化為 Sony');

const brandAppleTw = NormalizationService.recognizeBrand('蘋果 iPhone 15 Pro 台灣公司貨');
assert.strictEqual(brandAppleTw, 'Apple', '中文「蘋果」應正規化為 Apple');

const brandZojirushi = NormalizationService.recognizeBrand('象印 圧力IH炊飯ジャー');
assert.strictEqual(brandZojirushi, 'Zojirushi', '中文「象印」應正規化為 Zojirushi');

// 測試 3: 型號識別
const modelSony = NormalizationService.recognizeModel('Sony WH-1000XM5 降噪耳機');
assert.strictEqual(modelSony, 'WH-1000XM5', '應精確識別 WH-1000XM5');

const modelDell = NormalizationService.recognizeModel('DELL UltraSharp 27 4K 顯示器 U2723QE');
assert.strictEqual(modelDell, 'U2723QE', '應精確識別 U2723QE');

// 測試 4: 變體規格 (顏色、容量、電壓)
const rawMock: RawProduct = {
  source: 'mock_tw_store',
  sourceProductId: 'TEST-001',
  title: 'Apple iPhone 15 Pro 256GB 原色鈦金屬 台灣公司貨',
  category: 'Smartphones',
  price: 38400,
  currency: 'TWD',
  imageUrl: '',
  productUrl: '',
  condition: 'BRAND_NEW',
  sellerName: '測試店家',
  sellerRating: 5.0,
  sellerReviewCount: 10,
  shipsToTaiwan: true,
  countryOfOrigin: 'TW',
  shippingFee: 0,
  minDeliveryDays: 1,
  maxDeliveryDays: 2,
  warrantyType: 'TAIWAN_OFFICIAL',
  warrantyMonths: 12,
  returnPolicyDays: 7,
  rawAttributes: {},
  isMockData: true
};

const normResult = NormalizationService.normalizeRawProduct(rawMock);
assert.strictEqual(normResult.brand, 'Apple', '品牌應為 Apple');
assert.strictEqual(normResult.model, 'iPhone 15 Pro', '型號應為 iPhone 15 Pro');
assert.strictEqual(normResult.variant.capacity, '256GB', '容量應提取為 256GB');
assert.strictEqual(normResult.variant.color, '原色鈦金屬', '顏色應提取為 原色鈦金屬');

// 測試 5: 配件判定
const isAccessory = NormalizationService.isAccessory('Sony WH-1000XM5 替換耳塞 配件');
assert.strictEqual(isAccessory, true, '配件應正確被識別');

console.log('✔ [單元測試通過] NormalizationService 全部測項驗證通過！');
