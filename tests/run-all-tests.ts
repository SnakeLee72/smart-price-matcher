console.log('====================================================');
console.log('  SmartPrice Matcher 全套自動化測試套件開始執行');
console.log('====================================================\n');

async function main() {
  try {
    // 1. 單元測試
    require('./unit/normalization.test');
    require('./unit/landed-cost.test');
    require('./unit/matching.test');
    require('./unit/recommendation.test');
    await require('./unit/search-core.test').default;
    await require('./unit/identity.test').default;
    require('./unit/price-history.test');
    await require('./unit/external-media.test').default;
    require('./unit/preflight.test');

    // 2. 整合測試
    await require('./integration/orchestrator.test').default;
    await require('./integration/search-core.test').default;
    await require('./integration/search-api.test').default;
    await require('./integration/personal-api.test').default;

    console.log('\n====================================================');
    console.log('  🎉 所有單元測試與整合測試全數通過！');
    console.log('====================================================');
  } catch (err) {
    console.error('\n❌ 測試執行過程中發生錯誤:', err);
    process.exit(1);
  }
}

main();
