import assert from 'node:assert/strict';
const { validateProductionEnv } = require('../../scripts/preflight.cjs') as { validateProductionEnv: (env: NodeJS.ProcessEnv) => string[] };
const base = {
  ...process.env,
  NEXTAUTH_URL: 'https://prices.example.test',
  NEXT_PUBLIC_APP_URL: 'https://prices.example.test',
  NEXTAUTH_SECRET: 'test-signing-secret-32-characters-minimum',
  ADMIN_API_TOKEN: 'separate-test-admin-token-32-characters',
  DATABASE_URL: 'postgresql://app:long-example-password@db.example.test:5432/prices?sslmode=require',
  ENABLE_PRICE_PERSISTENCE: 'true',
  ENABLE_CONNECTOR_LOGS: 'true'
};
assert.deepEqual(validateProductionEnv(base), []);
const invalid = validateProductionEnv({ ...base, NEXTAUTH_URL: 'http://prices.example.test', DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/prices' });
assert.ok(invalid.some((issue) => /HTTPS URL/.test(issue)));
assert.ok(invalid.some((issue) => /require TLS/.test(issue)));
assert.ok(!invalid.join(' ').includes('long-example-password'));
console.log('✔ Production preflight accepts safe configuration and rejects unsafe configuration');
