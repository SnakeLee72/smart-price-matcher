import assert from 'node:assert/strict';
import { safeImageUrl, safeProductUrl } from '../../src/lib/external-media';
import { GET as getImage } from '../../src/app/api/images/route';
import { NextRequest } from 'next/server';

async function run() {
  assert.equal(safeProductUrl('https://tw-mall.example.com/p/1', true), null);
  assert.equal(safeProductUrl('javascript:alert(1)', false), null);
  assert.equal(safeProductUrl('https://tw-mall.example.com.evil.test/p/1', false), null);
  assert.equal(safeImageUrl('https://images.unsplash.com/photo-1?w=600'), 'https://images.unsplash.com/photo-1?w=600');
  assert.equal(safeImageUrl('https://images.unsplash.com@127.0.0.1/secret'), null);
  assert.equal(safeImageUrl('http://images.unsplash.com/photo-1'), null);
  const rejected = await getImage(new NextRequest('http://localhost/api/images?url=' + encodeURIComponent('https://127.0.0.1/private')));
  assert.equal(rejected.status, 400);
  console.log('✔ External media allowlist and proxy rejection verified');
}

export default run();
