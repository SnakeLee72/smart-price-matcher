import { test, expect } from '@playwright/test';

test('首頁搜尋、篩選、排序、比較與商品詳情', async ({ page }, testInfo) => {
  await page.route('**/api/favorites', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [] }) }));
  await page.route('**/api/price-history/**', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ success: false }) }));
  await page.goto('/');
  await page.getByPlaceholder(/輸入商品名稱/).fill('Sony');
  await page.getByRole('button', { name: '智慧比價' }).click();
  await expect(page).toHaveURL(/\/search\?q=Sony/);
  await expect(page.getByText(/筆報價結果/)).toBeVisible();
  await expect(page.getByText('模擬資料').first()).toBeVisible();
  await expect(page.getByTitle('加入商品比較').first()).toBeVisible();

  if (testInfo.project.name.startsWith('mobile')) {
    await page.getByRole('button', { name: '篩選條件', exact: true }).click();
    await expect(page.getByRole('dialog', { name: '搜尋篩選條件' })).toBeVisible();
    await page.getByRole('dialog').getByLabel('資料來源').selectOption('mock_tw_store');
    await page.getByRole('button', { name: '查看結果' }).click();
  } else {
    await page.getByLabel('資料來源').selectOption('mock_tw_store');
  }
  await expect(page.getByText(/筆報價結果/)).toBeVisible();
  await page.getByRole('combobox').first().selectOption('PRICE_ASC');
  await expect(page.getByTitle('加入商品比較').first()).toBeVisible();
  await page.getByTitle('加入商品比較').first().click();
  await page.getByTitle('加入商品比較').first().click();
  await page.getByRole('link', { name: '前往比較' }).click();
  await expect(page.getByRole('heading', { name: /多品項規格與到手價格矩陣比較/ })).toBeVisible();

  await page.goto('/search?q=Sony');
  await page.getByRole('link', { name: '商品詳情' }).first().click();
  await expect(page).toHaveURL(/\/products\//);
  await expect(page.getByText('預估總到手價').first()).toBeVisible();
  await expect(page.getByText('模擬資料，無購買連結').first()).toBeVisible();
});

test('收藏互動與來源網址安全狀態', async ({ page }) => {
  let saved = false;
  await page.route('**/api/favorites', async (route) => {
    if (route.request().method() === 'POST') {
      saved = true;
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ success: true, data: { id: 'e2e-favorite' } }) });
    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [] }) });
    }
  });
  await page.goto('/search?q=Sony');
  await expect(page.getByTitle('加入收藏').first()).toBeVisible();
  await page.getByTitle('加入收藏').first().click();
  await expect(page.getByTitle('已收藏').first()).toBeVisible();
  expect(saved).toBe(true);
  await expect(page.getByText('模擬資料，無購買連結').first()).toBeVisible();
  expect(await page.locator('a[href*="example.com"]').count()).toBe(0);
});

test('管理資訊與圖片代理拒絕未授權來源', async ({ request, page }) => {
  const image = await request.get('/api/images?url=' + encodeURIComponent('https://127.0.0.1/private'));
  expect(image.status()).toBe(400);
  const session = await request.get('/api/admin/session');
  expect(session.status()).toBe(403);
  await page.goto('/admin');
  await expect(page.getByRole('button', { name: '驗證並進入管理頁' })).toBeVisible();
  await expect(page.getByText('最近 Connector 紀錄')).toHaveCount(0);
});

test('收藏寫入資料庫並於重新載入後保留', async ({ page }) => {
  test.skip(!process.env.E2E_DATABASE_URL, '需要測試用 PostgreSQL；本機 Mock 流程以 API 替身驗證');
  await page.goto('/search?q=Sony');
  await expect(page.getByTitle('加入收藏').first()).toBeVisible();
  await page.getByTitle('加入收藏').first().click();
  await expect(page.getByTitle('已收藏').first()).toBeVisible();
  await page.goto('/favorites');
  await expect(page.getByRole('heading', { name: '我的商品收藏與降價追蹤' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Sony/i }).first()).toBeVisible();
  await page.reload();
  await expect(page.getByRole('link', { name: /Sony/i }).first()).toBeVisible();
  await page.getByTitle('移除收藏').first().click();
  await expect(page.getByText('目前尚無收藏商品')).toBeVisible();
});
