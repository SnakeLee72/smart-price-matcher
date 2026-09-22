# SmartPrice Matcher

台日跨來源比價 MVP。**目前兩個資料來源皆為 Mock，所有價格均為模擬資料，並非即時市場報價。**網站不代替使用者下單。

## 功能與架構

Next.js 16 App Router、React 19、TypeScript strict mode、Tailwind CSS、Prisma、PostgreSQL。搜尋協調器平行呼叫 Mock Taiwan 與 Mock Japan Connector，進行資料標準化、到手價估算、篩選、排序與規則式推薦。可瀏覽商品、比較最多四項商品、收藏、儲存目標價與查看資料庫中的價格歷史。詳見 [架構與階段規劃](docs/architecture.md)。

## 本機安裝與啟動

需要 Node.js 22、npm 與 PostgreSQL 16。複製 `.env.example` 為 `.env`，設定 `DATABASE_URL`、`NEXTAUTH_SECRET`（持續使用同一個隨機值）和 `NEXTAUTH_URL`。不要提交 `.env` 或任何 API 憑證。

```sh
npm ci
npx prisma generate
npx prisma migrate deploy
npm run db:seed
npm run dev
```

開啟 `http://localhost:3000`。Mock 搜尋不依賴資料庫；收藏、目標價與價格歷史需要 PostgreSQL。若資料庫不可用，相關 API 會回傳 503，不會改存於共用記憶體。Seed 可重複執行，會加入缺少的 Mock 商品與示範歷史資料，不會清除收藏或既有報價紀錄。Seed 的歷史點是模擬資料。

Windows PowerShell 若限制 `npm.ps1`，改用 `npm.cmd`；`npx` 可改用 `npx.cmd`。

## Docker 啟動

先在 Compose 讀取的 `.env` 中設定持久的 `NEXTAUTH_SECRET`，再執行：

```sh
docker compose up --build
docker compose exec app npm run db:seed
```

App 使用 `http://localhost:3000`，PostgreSQL 使用本機 5432。容器啟動時自動套用 migration；Seed 需手動執行。啟用 `ENABLE_PRICE_PERSISTENCE=true` 時，搜尋觀測到的報價會寫入資料庫；單一來源或資料庫暫時失敗不會阻斷 Mock 搜尋。

## Vercel 展示站部署

此專案可從 GitHub 匯入 Vercel，根目錄選擇倉庫根目錄，Framework Preset 為 Next.js。`vercel.json` 指定 `npm run build`，該命令會先產生 Prisma Client。未設定 PostgreSQL 時，首頁、Mock 搜尋、比較與商品詳情可以展示；收藏、目標價、價格歷史和 Connector 紀錄需要資料庫與 `NEXTAUTH_SECRET`。Vercel 的執行環境是無狀態的，管理頁的 Connector 開關不會跨請求穩定保存，展示站不應依賴該開關。

若要啟用資料庫，可在 Vercel Marketplace 連接 PostgreSQL，設定 `DATABASE_URL`、`NEXTAUTH_SECRET`、`NEXTAUTH_URL`（正式網址）及 `ADMIN_API_TOKEN`。先對資料庫執行 `npm run db:migrate:deploy`，再開啟 `ENABLE_PRICE_PERSISTENCE=true` 與 `ENABLE_CONNECTOR_LOGS=true`。環境變數只在 Vercel 專案設定中輸入，不要提交到 GitHub。部署完成後設定 `SMOKE_BASE_URL` 為網站網址，執行 `npm run smoke`；若已接資料庫，另設 `SMOKE_REQUIRE_DB=true`。

GitHub Pages 只能託管靜態檔案，無法執行本專案的 Next.js API。展示站所有商品皆為 Mock Data，沒有真實購買連結或即時價格。

## 環境變數

| 名稱 | 用途 |
| --- | --- |
| `DATABASE_URL` | PostgreSQL 連線字串 |
| `NEXTAUTH_SECRET` | NextAuth JWT 與匿名 Cookie 的簽章金鑰；收藏功能必需 |
| `NEXTAUTH_URL` | 登入回呼基準網址 |
| `GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET` | 可選 Google OAuth |
| `MICROSOFT_ENTRA_ID_CLIENT_ID`、`MICROSOFT_ENTRA_ID_CLIENT_SECRET`、`MICROSOFT_ENTRA_ID_TENANT_ID` | 可選 Microsoft Entra ID OAuth |
| `ENABLE_PRICE_PERSISTENCE` | 設為 `true` 以記錄搜尋觀測到的報價；本機預設關閉 |
| `ENABLE_CONNECTOR_LOGS` | 設為 `true` 以記錄 Connector 成敗與耗時；本機預設關閉 |
| `ADMIN_API_TOKEN` | 管理 Connector 寫入與詳細健康訊息的伺服器端 Token |
| `NEXT_PUBLIC_APP_URL` | 公開應用網址 |

未設定 OAuth 憑證時可使用匿名收藏。匿名身分以簽章、HttpOnly Cookie 隔離；清除 Cookie、換裝置或更換 `NEXTAUTH_SECRET` 後，舊匿名收藏無法自動找回。登入後的收藏不會自動合併匿名收藏。Email 登入目前只保留擴充方向，尚未提供。

## 測試

```sh
npm test
npm run test:e2e
node node_modules/typescript/bin/tsc --noEmit
npm run build
npx prisma validate
npm audit
```

測試涵蓋商品正規化、同款比對、成本、推薦、來源逾時／失敗、搜尋 API、匿名 Cookie、OAuth JWT 解析，以及桌機與手機的搜尋、篩選、排序、比較、詳情、收藏互動與安全頁面。Playwright 使用本機 Chrome；收藏互動採 API 測試替身，實際 PostgreSQL 寫入驗證仍待在有資料庫的環境完成。

## API

| 路徑 | 用途 |
| --- | --- |
| `GET /api/search?q=Sony` | 跨 Mock 來源搜尋、篩選、排序與分頁 |
| `GET /api/products/:id` | 商品及不同來源報價 |
| `POST /api/compare` | 比較最多四項報價 |
| `GET /api/connectors`、`GET /api/connectors/health` | 資料來源與健康狀態 |
| `GET /api/connectors/logs` | 管理員查詢來源執行紀錄；需 `x-admin-token` |
| `GET /api/admin/session` | 驗證管理 Token；需 `x-admin-token` |
| `GET /api/images?url=...` | 代理限定來源的圖片 |
| `POST /api/connectors` | 啟閉 Connector；需 `x-admin-token` |
| `GET/POST /api/favorites`、`DELETE /api/favorites/:id` | 個人收藏與目標價 |
| `GET/POST /api/price-alerts`、`DELETE /api/price-alerts/:id` | 個人目標價設定 |
| `GET /api/price-history/:productId` | 資料庫中的價格觀測紀錄 |
| `/api/auth/*` | NextAuth 登入、登出與工作階段 |

`GET /api/search` 支援 `q`、`brand`、`model`、`category`、`condition`、`color`、`size`、`capacity`、`voltage`、`specification`、`countryOfOrigin`、`sources`（逗號分隔）、`warrantyType`、`shipsToTaiwan`、`inStock`、`minPrice`、`maxPrice`、`minShipping`、`maxShipping`、`maxDeliveryDays`、`minSellerRating`、`minReturnPolicyDays`、`sortBy`、`mode`、`page`、`pageSize`。價格與運費篩選都以估算新台幣計。常見需求如「預算 15000」、「256GB」、「台灣公司貨」、「可寄台灣」會轉成明確條件。

來源搜尋各自限制 3.5 秒及每分鐘 30 次未命中快取的請求。快取和速率限制目前只作用於單一伺服器程序。

## 擴充 Connector

在 `src/connectors` 實作 `CommerceConnector` 的 `search`、`getProductDetail`、`normalize`、`healthCheck`，並於 Registry 註冊。外部憑證只在伺服器端使用。優先採用官方 API 或授權 Feed，不繞過平台存取限制。Amazon Japan 目前只有預留骨架，未串接正式 API。

## 安全與已知限制

第五階段部署步驟與驗收清單見 [部署文件](docs/deployment.md)。目前僅適合 Mock Data 展示與測試，尚未具備真實商品來源或價格通知寄送。

商品連結採網域白名單；Mock Data 的示範網址不提供購買。圖片僅允許 `images.unsplash.com`，經後端代理取得，限制 HTTPS、5 秒、3 MB、圖片格式與重新導向。增加正式 Connector 時，需先在 `src/lib/external-media.ts` 審核並加入商品與圖片網域。管理頁須驗證伺服器端 Token 才載入詳細資訊；Token 只留在頁面記憶體。Connector 開關目前只作用於單一伺服器程序，重啟後會重設。正式部署仍需提供 HTTPS、Secret Manager 與公開 API 速率限制；管理頁尚未整合身分與角色。匯率是固定示範值，稅費僅為估算；最終價格以原始網站結帳頁為準。價格目標可以儲存，但**尚未建立郵件服務或通知工作程序，不會發送降價通知**。Google 與 Microsoft 登入需各自建立 OAuth 憑證並設定回呼網址；設定方式參考 [NextAuth Google](https://next-auth.js.org/providers/google) 與 [Azure AD](https://next-auth.js.org/providers/azure-ad) 文件。

