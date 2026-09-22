import assert from 'assert';
import { NextRequest } from 'next/server';
import { GET } from '../../src/app/api/search/route';
import { GET as getConnectorLogs } from '../../src/app/api/connectors/logs/route';

async function run() {
  const params = new URLSearchParams({ q: 'iPhone 256GB 台灣公司貨', sortBy: 'PRICE_ASC' });
  const response = await GET(new NextRequest(`http://localhost:3000/api/search?${params}`));
  assert.strictEqual(response.status, 200);
  const body = await response.json();
  assert.strictEqual(body.success, true);
  assert.ok(body.data.totalCount > 0);
  assert.ok(body.data.offers.every((offer: { source: string; variant: { capacity?: string } }) =>
    offer.source === 'mock_tw_store' && offer.variant.capacity === '256GB'
  ));

  const invalid = await GET(new NextRequest('http://localhost:3000/api/search?q=Sony&minPrice=100&maxPrice=10'));
  assert.strictEqual(invalid.status, 400);
  const protectedLogs = await getConnectorLogs(new NextRequest('http://localhost:3000/api/connectors/logs'));
  assert.strictEqual(protectedLogs.status, 403);
}

export default run();
