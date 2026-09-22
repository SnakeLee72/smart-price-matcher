# 第五階段：部署與上線前驗收

## 目前可部署範圍

目前只有兩個 Mock Connector。部署後仍是**展示／測試網站**，所有報價皆為模擬資料，不能宣稱即時真實價格，也沒有可用的購買連結。價格通知只會保存目標價，尚不會寄信。正式商用上線須先取得授權商品資料來源、建立實際匯率與稅費資料來源，並完成通知工作程序。

## 本機驗證

```sh
npm ci
npx prisma generate
npm test
npm run test:e2e
npm run build
npm audit
```

端對端測試使用本機 Chrome。一般收藏互動測試會攔截收藏 API；若提供已完成 migration 的測試 PostgreSQL，設定 `E2E_DATABASE_URL` 後再執行 `npm run test:e2e`，會額外驗證收藏寫入與重新載入後保留。若沒有 Chrome，先執行 `npx playwright install chromium`，並在 `playwright.config.ts` 改用 bundled Chromium。

## 部署配置

1. 將 PostgreSQL 16 與應用部署在同一私人網路；資料庫需啟用 TLS、備份與還原演練。
2. 參考 `deploy/production.env.example` 設定 `DATABASE_URL`（帶 `sslmode=require` 或更嚴格）、`NEXTAUTH_SECRET`、`ADMIN_API_TOKEN`、`NEXTAUTH_URL`、`NEXT_PUBLIC_APP_URL`。Secret 應透過部署平台的 Secret Manager 或環境變數注入，禁止寫入映像或 Git。
3. 對外使用 HTTPS 反向代理或受管理入口。正式 Compose 只將應用綁定到主機的 `127.0.0.1:3000`，不能直接對網際網路暴露 HTTP。
4. 在入口設定針對 `/api/*` 的全域限流、存取日誌與安全監控。目前程式內的 Connector 限流只在單一程序有效，不能代替入口限流。
5. 建置不可變映像標籤：`docker build -t smart-price-matcher:<version> .`。設定 `APP_IMAGE` 指向該標籤，執行 `docker compose -f deploy/docker-compose.production.yml up -d`。容器啟動時執行 `scripts/preflight.cjs` 與 `prisma migrate deploy`。
6. 透過 `GET /api/health` 檢查程序存活，透過 `GET /api/ready` 檢查資料庫就緒。兩端點都不回傳 Secret。

部署後可設定 `SMOKE_BASE_URL=https://your-host`、`SMOKE_REQUIRE_DB=true` 並執行 `npm run smoke`，檢查健康、資料庫就緒、安全標頭、Mock 搜尋、管理權限與圖片白名單；再執行瀏覽器端對端測試。此 smoke test 只驗證展示站的基本路徑，不能取代真實來源與資料庫驗收。

`npm run preflight` 可在部署前檢查設定；只列錯誤名稱，不列 Secret 值。正式環境需確認管理 Token 與登入 Secret 不同，且皆為獨立、足夠長的隨機值。

## 驗收清單

- [x] 單元／整合測試、桌機與手機端對端測試、Prisma Schema 驗證與正式建置已在本機通過。
- [x] Docker 排除敏感檔；正式設定有啟動前檢查、非 root 執行、就緒端點與健康檢查。
- [x] 已啟動本機 production 模式 Next.js，`npm run smoke` 通過；生產相依套件稽核零項弱點。
- [ ] 在目標環境實際建置與啟動容器（本機沒有 Docker）。
- [ ] 以測試資料庫驗證 migration、收藏、價格歷史、重啟後資料保留及備份還原。
- [ ] 驗證公開 HTTPS、入口全域限流、監控警報、OAuth 回呼與管理權限。
- [ ] 接入獲授權的真實來源與實際費率，複核商品連結及圖片網域白名單。
- [ ] 建立價格通知工作程序並完成寄信驗證。
- [ ] 完成部署後桌機／手機 smoke test 與營運交接。

部署失敗時，先保留資料庫備份，將 `APP_IMAGE` 切回上個已驗收的映像版本，再檢查 migration 是否具備向後相容性；不要在未確認資料影響前直接回滾資料庫。
