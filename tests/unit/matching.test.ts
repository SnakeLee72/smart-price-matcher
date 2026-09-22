import assert from 'assert';
import { ProductMatcher } from '../../src/services/product-matcher';
import { ProductOffer, CanonicalProduct } from '../../src/types/commerce';

console.log('▶ [單元測試] 同款商品比對與嚴格防混淆規則 (ProductMatcher)...');

const mockCanonicalCatalog: CanonicalProduct[] = [
  {
    id: 'canon-sony-xm5',
    brand: 'Sony',
    model: 'WH-1000XM5',
    normalizedName: 'Sony WH-1000XM5',
    category: 'Headphones',
    gtin: '4548736132566',
    mpn: 'WH1000XM5',
    specifications: {},
    createdAt: '',
    updatedAt: ''
  },
  {
    id: 'canon-iphone-256',
    brand: 'Apple',
    model: 'iPhone 15 Pro',
    normalizedName: 'Apple iPhone 15 Pro 256GB',
    category: 'Smartphones',
    specifications: { capacity: '256GB' },
    createdAt: '',
    updatedAt: ''
  }
];

// 測試 1: GTIN 完全相同匹配
const offerGtinMatch: Partial<ProductOffer> = {
  title: 'Sony WH-1000XM5 降噪耳機',
  brand: 'Sony',
  model: 'WH-1000XM5',
  gtin: '4548736132566',
  variant: { color: '黑色' }
};
const res1 = ProductMatcher.matchOfferToCanonical(offerGtinMatch as ProductOffer, mockCanonicalCatalog);
assert.strictEqual(res1.isMatched, true, 'GTIN 相符應匹配成功');
assert.strictEqual(res1.canonicalProductId, 'canon-sony-xm5');
assert.strictEqual(res1.matchMethod, 'GTIN_EAN_UPC_JAN_EXACT');

// 測試 2: 不同容量嚴格不可合併
const offerDiffCap: Partial<ProductOffer> = {
  title: 'Apple iPhone 15 Pro 128GB',
  brand: 'Apple',
  model: 'iPhone 15 Pro',
  variant: { capacity: '128GB' } // 候選目錄為 256GB
};
const res2 = ProductMatcher.matchOfferToCanonical(offerDiffCap as ProductOffer, mockCanonicalCatalog);
const conflictingIdentifier = ProductMatcher.evaluatePair({
  ...offerDiffCap,
  gtin: '195949038234'
} as ProductOffer, { ...mockCanonicalCatalog[1], gtin: '195949038234' });
assert.strictEqual(conflictingIdentifier.isMatched, false, '容量不同時，即使 GTIN 相同也不能合併');
assert.deepStrictEqual(conflictingIdentifier.conflictingFields, ['capacity']);
assert.strictEqual(res2.isMatched, false, '不同容量之手機嚴格禁止合併至相同標準商品');

// 測試 3: 配件與主機不可合併
const offerAccessory: Partial<ProductOffer> = {
  title: 'Sony WH-1000XM5 專用保護套 配件',
  brand: 'Sony',
  model: 'WH-1000XM5',
  variant: {}
};
const res3 = ProductMatcher.matchOfferToCanonical(offerAccessory as ProductOffer, mockCanonicalCatalog);
assert.strictEqual(res3.isMatched, false, '配件不可與主商品目錄合併');

console.log('✔ [單元測試通過] ProductMatcher 規則驗證通過！');
