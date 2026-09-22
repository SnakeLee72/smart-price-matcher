import assert from 'assert';
import { shouldRecordSnapshot } from '../../src/services/price-history-recorder';

const now = Date.UTC(2026, 8, 21);
assert.strictEqual(shouldRecordSnapshot(null, 100, 120, now), true);
const recent = { price: 100, landedCostTwd: 120, recordedAt: new Date(now - 60_000) };
assert.strictEqual(shouldRecordSnapshot(recent, 100, 120, now), false);
assert.strictEqual(shouldRecordSnapshot(recent, 99, 120, now), true);
assert.strictEqual(shouldRecordSnapshot(recent, 100, 121, now), true);
const old = { ...recent, recordedAt: new Date(now - 25 * 60 * 60 * 1000) };
assert.strictEqual(shouldRecordSnapshot(old, 100, 120, now), true);
