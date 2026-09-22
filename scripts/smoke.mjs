const baseUrl = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3000';
const check = async (path, expectedStatus) => {
  const response = await fetch(new URL(path, baseUrl), { signal: AbortSignal.timeout(10_000) });
  if (response.status !== expectedStatus) throw new Error(`${path}: expected ${expectedStatus}, got ${response.status}`);
  return response;
};

try {
  const healthResponse = await check('/api/health', 200);
  if (healthResponse.headers.get('x-content-type-options') !== 'nosniff' || !healthResponse.headers.get('strict-transport-security')) {
    throw new Error('Required security headers are missing');
  }
  const health = await healthResponse.json();
  if (health.status !== 'up') throw new Error('Liveness payload is invalid');
  if (process.env.SMOKE_REQUIRE_DB === 'true') await check('/api/ready', 200);
  const search = await (await check('/api/search?q=Sony', 200)).json();
  if (!search.success || !search.data?.offers?.length || search.data.offers.some((offer) => !offer.isMockData)) {
    throw new Error('Mock search payload is invalid');
  }
  await check('/api/admin/session', 403);
  await check('/api/images?url=' + encodeURIComponent('https://127.0.0.1/private'), 400);
  console.log('Smoke checks passed: health, security headers, mock search, admin protection, image allowlist' + (process.env.SMOKE_REQUIRE_DB === 'true' ? ', database readiness' : ''));
} catch (error) {
  console.error('Smoke checks failed:', error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
