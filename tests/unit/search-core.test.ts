import assert from 'assert';
import { ConnectorRateLimiter } from '../../src/services/connector-rate-limiter';
import { parseSearchIntent } from '../../src/services/search-intent';
import { matchesOffer } from '../../src/services/offer-filter';
import { LandedCostCalculator } from '../../src/services/landed-cost-calculator';
import { MockTaiwanConnector } from '../../src/connectors/mock-taiwan';
import { MOCK_PRODUCTS_DATA } from '../../src/connectors/mock-data';

const intent = parseSearchIntent('iPhone 256GB 台灣公司貨 預算 15000 可寄台灣');
assert.strictEqual(intent.keyword, 'iPhone');
assert.strictEqual(intent.capacity, '256GB');
assert.strictEqual(intent.maxPrice, 15000);
assert.strictEqual(intent.warrantyType, 'TAIWAN_OFFICIAL');
assert.strictEqual(intent.countryOfOrigin, 'TW');
assert.strictEqual(intent.shipsToTaiwan, true);

const limiter = new ConnectorRateLimiter(2, 1000);
assert.strictEqual(limiter.allow('a', 1000), true);
assert.strictEqual(limiter.allow('a', 1001), true);
assert.strictEqual(limiter.allow('a', 1002), false);
assert.strictEqual(limiter.allow('b', 1002), true);
assert.strictEqual(limiter.allow('a', 2001), true);

const freeShipping = LandedCostCalculator.calculate({ itemPrice: 10000, currency: 'JPY', category: 'Headphones', domesticShipping: 0, internationalShipping: 0, couponDiscount: 1000, shipsToTaiwan: true });
assert.strictEqual(freeShipping.missingCostFields.includes('internationalShipping'), false);
assert.strictEqual(freeShipping.discountTwd, 0, 'unconfirmed coupons must not lower the price');
assert.ok(freeShipping.calculationNotes.some((note) => note.includes('示範固定值')));

const connector = new MockTaiwanConnector();
const raw = MOCK_PRODUCTS_DATA.find((product) => product.source === connector.source && product.sourceProductId === 'TW-SONY-XM5-BLK');
assert.ok(raw);
export default connector.normalize(raw).then((offer) => {
  assert.strictEqual(matchesOffer(offer, { keyword: 'Sony', sources: ['mock_tw_store'] }), true);
  assert.strictEqual(matchesOffer(offer, { keyword: 'Sony', sources: ['mock_jp_store'] }), false);
  assert.strictEqual(matchesOffer(offer, { keyword: 'Sony', condition: 'USED' }), false);
  assert.strictEqual(matchesOffer(offer, { keyword: 'Sony', maxShipping: 0 }), true);
  assert.strictEqual(matchesOffer(offer, { keyword: 'Sony', minPrice: offer.landedCost.totalTwd + 1 }), false);
  assert.strictEqual(matchesOffer(offer, { keyword: 'Sony', color: '不存在的顏色' }), false);
});
