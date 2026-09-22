import assert from 'assert';
import { NextRequest } from 'next/server';
import { POST as createFavorite } from '../../src/app/api/favorites/route';
import { DELETE as deleteFavorite } from '../../src/app/api/favorites/[id]/route';
import { POST as createAlert } from '../../src/app/api/price-alerts/route';
import { GET as getHistory } from '../../src/app/api/price-history/[productId]/route';

async function run() {
  const malformed = new NextRequest('http://localhost/api/favorites', { method: 'POST', body: '{', headers: { 'content-type': 'application/json' } });
  assert.strictEqual((await createFavorite(malformed)).status, 400);
  const badAlert = new NextRequest('http://localhost/api/price-alerts', { method: 'POST', body: JSON.stringify({ productId: 'x', targetPriceTwd: -1 }), headers: { 'content-type': 'application/json' } });
  assert.strictEqual((await createAlert(badAlert)).status, 400);
  assert.strictEqual((await deleteFavorite(new NextRequest('http://localhost/api/favorites/bad', { method: 'DELETE' }), { params: Promise.resolve({ id: 'bad' }) })).status, 400);
  assert.strictEqual((await getHistory(new NextRequest('http://localhost/api/price-history/no-such-product'), { params: Promise.resolve({ productId: 'no-such-product' }) })).status, 404);
}

export default run();
