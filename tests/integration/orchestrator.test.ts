import assert from 'assert';
import { SearchOrchestrator } from '../../src/services/search-orchestrator';
import { ConnectorRegistry } from '../../src/connectors/registry';

console.log('▶ [整合測試] SearchOrchestrator 多 Connector 調度、快取與容錯測試...');

async function runTests() {
  const orchestrator = new SearchOrchestrator();

  // 測試 1: 多 Connector 並行搜尋
  const search1 = await orchestrator.executeSearch({ keyword: 'Sony' });
  assert.strictEqual(search1.offers.length > 0, true, '應成功搜尋出商品 Offers');
  assert.strictEqual(search1.successfulSources.length >= 2, true, '台灣與日本來源應均成功回傳');
  assert.strictEqual(search1.cached, false, '第一次搜尋不應命中快取');

  // 測試 2: 快取命中測試
  const search2 = await orchestrator.executeSearch({ keyword: 'Sony' });
  assert.strictEqual(search2.cached, true, '短時間內相同條件應命中快取');
  assert.strictEqual(search2.offers.length, search1.offers.length, '快取結果數量應一致');

  // 測試 3: 篩選與分頁
  const searchPaged = await orchestrator.executeSearch({ keyword: 'Sony', page: 1, pageSize: 1 });
  assert.strictEqual(searchPaged.offers.length, 1, '單頁上限為 1 時應僅回傳 1 筆商品');
  assert.strictEqual(searchPaged.totalCount > 1, true, '總筆數仍應大於 1');

  // 測試 4: 單一來源停用隔離測試
  const registry = ConnectorRegistry.getInstance();
  registry.setConnectorStatus('mock_jp_store', false); // 停用日本來源

  const searchWithoutJp = await orchestrator.executeSearch({ keyword: 'DELL' });
  assert.strictEqual(searchWithoutJp.successfulSources.includes('mock_jp_store'), false, '已停用之來源不應發送請求');
  assert.strictEqual(searchWithoutJp.successfulSources.includes('mock_tw_store'), true, '正常啟用之來源仍應成功回傳');

  // 復原狀態
  registry.setConnectorStatus('mock_jp_store', true);

  console.log('✔ [整合測試通過] SearchOrchestrator 測試驗證全數通過！');
}

export default runTests();
