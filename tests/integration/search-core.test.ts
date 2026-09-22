import assert from 'assert';
import { CommerceConnector } from '../../src/connectors/base';
import { ConnectorRegistry } from '../../src/connectors/registry';
import { SearchOrchestrator } from '../../src/services/search-orchestrator';
import { RawProduct } from '../../src/types/commerce';

async function run() {
  const registry = ConnectorRegistry.getInstance();
  let slowEnabled = true;
  let brokenEnabled = true;
  const slow: CommerceConnector = {
    source: 'test_slow', displayName: 'Slow Test', country: 'TW', isMock: true,
    isEnabled: () => slowEnabled, setEnabled: (value) => { slowEnabled = value; },
    search: () => new Promise<RawProduct[]>(() => {}),
    getProductDetail: async () => null,
    normalize: async () => { throw new Error('unused'); },
    healthCheck: async () => ({ source: 'test_slow', displayName: 'Slow Test', status: 'DOWN', latencyMs: 0, lastCheckedAt: new Date().toISOString() })
  };
  const broken: CommerceConnector = {
    ...slow, source: 'test_broken', displayName: 'Broken Test',
    isEnabled: () => brokenEnabled, setEnabled: (value) => { brokenEnabled = value; },
    search: async () => { throw new Error('private upstream detail'); }
  };
  registry.register(slow);
  registry.register(broken);
  const orchestrator = new SearchOrchestrator(30);
  const started = Date.now();
  const partial = await orchestrator.executeSearch({ keyword: 'Sony', sources: ['mock_tw_store', 'test_slow', 'test_broken'] });
  assert.ok(Date.now() - started < 1000, 'a connector ignoring abort must not block the search');
  assert.ok(partial.offers.length > 0);
  assert.deepStrictEqual(partial.failedSources.map((item) => item.source).sort(), ['test_broken', 'test_slow']);
  assert.strictEqual(partial.failedSources.find((item) => item.source === 'test_slow')?.reason, '來源逾時');
  assert.ok(partial.failedSources.every((item) => !item.reason.includes('private upstream')));

  const filtered = await orchestrator.executeSearch({ keyword: 'Sony', sources: ['mock_tw_store'], condition: 'USED', pageSize: 1 });
  assert.ok(filtered.offers.every((offer) => offer.condition === 'USED'));
  assert.ok(filtered.offers.length <= 1);

  const beforeToggle = await orchestrator.executeSearch({ keyword: 'Sony', sources: ['mock_tw_store'] });
  assert.ok(beforeToggle.offers.length > 0);
  registry.setConnectorStatus('mock_tw_store', false);
  try {
    const afterToggle = await orchestrator.executeSearch({ keyword: 'Sony', sources: ['mock_tw_store'] });
    assert.strictEqual(afterToggle.offers.length, 0);
    assert.strictEqual(afterToggle.cached, false);
  } finally {
    registry.setConnectorStatus('mock_tw_store', true);
    registry.setConnectorStatus('test_slow', false);
    registry.setConnectorStatus('test_broken', false);
  }
}

export default run();
