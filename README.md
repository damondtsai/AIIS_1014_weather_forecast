# Taiwan Weather Forecast 台灣七天天氣預報
> **從氣象資料到互動式天氣預報應用**  
> 基於交通部中央氣象署 (CWA) Open Data API、Next.js 14 App Router、TypeScript、LibSQL/SQLite、Recharts 折線圖與 Leaflet GIS 互動地圖的全端天氣預報系統。

---

## 📖 目錄
1. [專案介紹](#1-專案介紹)
2. [與原作業架構功能對照表](#2-與原作業架構功能對照表)
3. [系統架構與資料流程](#3-系統架構與資料流程)
4. [指定技術堆疊](#4-指定技術堆疊)
5. [CWA 氣象資料集與 JSON 解析](#5-cwa-氣象資料集與-json-解析)
6. [資料庫設計 (SQLite / LibSQL)](#6-資料庫設計-sqlite--libsql)
7. [後端 API 規格說明](#7-後端-api-規格說明)
8. [前端視覺元件與互動體驗](#8-前端視覺元件與互動體驗)
9. [本機安裝與啟動教學](#9-本機安裝與啟動教學)
10. [環境變數設定指南](#10-環境變數設定指南)
11. [Turso 雲端資料庫建置教學](#11-turso-雲端資料庫建置教學)
12. [Vercel 部署步驟與 Cron 設定](#12-vercel-部署步驟與-cron-設定)
13. [單元測試與自動化校驗](#13-單元測試與自動化校驗)
14. [資安注意事項](#14-資安注意事項)
15. [常見問題與故障排除 (FAQ)](#15-常見問題與故障排除-faq)
16. [已知限制與未來擴充規劃](#16-已知限制與未來擴充規劃)

---

## 1. 專案介紹
本專案為「人工智慧與資訊安全」課程專題，將中央氣象署 (CWA) 七天天氣預報開放資料 (`F-A0010-001`) 轉化為兼具專業度、資安防護與互動性之現代全端 Web 應用。
傳統架構採用 Python + Streamlit 雖能快速呈現，但在面對無伺服器 (Serverless) 雲端架構 (如 Vercel) 時，常遭遇本機 SQLite 檔案不可持久保存、前端直接曝露 API Key 以及版面自訂彈性受限之困境。本專案全面採用 **Next.js App Router (TypeScript)** 改寫，後端以 `@libsql/client` 達成「本機 SQLite 檔案」與「Vercel / Turso 雲端資料庫」無縫相容，前端結合 **Recharts** 繪製平滑高低溫趨勢圖，並以 **Leaflet** 打造六大區域 GIS 氣溫互動地圖。

---

## 2. 與原作業架構功能對照表

| 功能向度 | 原 Python / Streamlit 架構 | 本專案 Vercel / Next.js 架構 | 改良效益 |
| :--- | :--- | :--- | :--- |
| **底層架構** | Python (Streamlit 伺服器) | Next.js 14 (App Router + Node.js) | 高效能 Serverless 支援、冷啟動極速 |
| **資料庫儲存** | 單機 SQLite 實體檔 (`weather.db`) | 統一存取層 `@libsql/client` | 本機檔案開發，部署 Vercel 支援 Turso 雲端持久儲存 |
| **API 安全性** | 密鑰易混入前端腳本中 | 嚴格隔離：僅伺服器端路由存取 CWA | 瀏覽器 Network / JS 完全無法探查真實金鑰 |
| **資料防重覆** | 簡易 INSERT，重複執行易產生垃圾數據 | 參數化 SQLite `UPSERT` 複合唯一鍵 | 多次重複同步自動覆蓋更新，保證冪等性 |
| **氣溫折線圖** | 靜態圖或基礎圖表套件 | **Recharts** 響應式雙線圖 (MaxT/MinT) | 支援自訂 Tooltip、格線、圓點、平滑動畫 |
| **GIS 地圖** | 簡易地圖或無 | **Leaflet + React Leaflet** 台灣地圖 | 6大區域動態 Marker，依平均溫分色 (<20藍, 20-25綠, 25-30黃, >30紅) |
| **狀態保留** | 瀏覽器重整後選擇遺失 | **URL Search Params 雙向同步** | 重新整理或分享連結 (`?region=...&date=...`) 完整還原狀態 |
| **自動更新** | 需人工重啟指令腳本 | **Vercel Cron (定時每 60 分鐘排程)** | 自動保持最新氣象預報，附帶 Bearer 密鑰授權保護 |

---

## 3. 系統架構與資料流程

```
[ 中央氣象署 CWA Open Data API (F-A0010-001) ]
                  │
                  ▼ (HTTPS Server-side only)
  [ Next.js API: /api/weather/sync 或 /api/weather ]
                  │
                  ▼
         [ Zod Schema 嚴格型別校驗 ]
                  │
                  ▼
     [ Normalizer: 6大分區 / MinT / MaxT / AvgT ]
                  │
                  ▼
[ LibSQL / SQLite 資料庫 (UPSERT 參數化寫入) ]
                  │
                  ▼
     [ Next.js REST API (GET /api/weather) ]
                  │
                  ▼
        [ WeatherDashboard (React 18) ]
       ├── WeatherFilters (URL SearchParams 雙向綁定)
       ├── WeatherSummaryCards (氣象指標概況)
       ├── TemperatureChart (Recharts 紅藍折線圖)
       ├── TaiwanWeatherMap (Leaflet GIS 氣候分佈圖)
       └── ForecastTable (7日詳細數據表，支援手機橫向捲動)
```

---

## 4. 指定技術堆疊
- **核心架構**：Next.js 14 (App Router)、React 18、TypeScript (Strict Mode)
- **UI 與排版**：Tailwind CSS、Lucide React (現代向量圖示庫)
- **資料庫與驗證**：`@libsql/client` (SQLite 相容驅動)、Zod (執行時期資料驗證)
- **視覺化呈現**：
  - 折線圖表：`recharts`
  - GIS 地圖：`leaflet`、`react-leaflet`、OpenStreetMap 圖資 (SSR: false 動態載入)
- **測試框架**：Vitest、`@testing-library/react`、JSDOM
- **雲端部署**：Vercel、Turso (libSQL 雲端伺服器)

---

## 5. CWA 氣象資料集與 JSON 解析

- **資料集代碼**：`F-A0010-001` (台灣各地區一週天氣預報)
- **API 端點**：`https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-A0010-001`
- **六大標準區域**：
  1. `北部地區` (基隆、雙北、桃園、新竹、苗栗)
  2. `中部地區` (臺中、彰化、南投、雲林、嘉義)
  3. `南部地區` (臺南、高雄、屏東)
  4. `東北部地區` (宜蘭)
  5. `東部地區` (花蓮)
  6. `東南部地區` (臺東)
- **關鍵數值計算公式**：
  $$\text{avgT} = \frac{\text{minT} + \text{maxT}}{2}$$
- **健壯性解析機制**：
  1. 支援 `records.locations[].location` 與 `records.location` 雙結構。
  2. 元素匹配：依 `elementName = MinT`、`MaxT`、`Wx`、`PoP`、`CI` 獨立萃取，**禁止**單純依陣列索引盲目配對。
  3. 資料鍵整合：採用 `(regionName, dataDate, startTime, endTime)` 聚合，避免時段錯置。
  4. 數值轉換：文字安全轉浮點數，無法轉換者填入 `null`，不影響其他可用欄位。
  5. 內建離線備援：`public/mock/cwa-weather.json`（已脫敏），於離線、無 Key 或氣象署 API 維護時自動啟動降級顯示。

---

## 6. 資料庫設計 (SQLite / LibSQL)

本專案統一使用 `@libsql/client`，在開發時存取本地 `file:weather.db`，在 Vercel 生產環境存取 `libsql://...`。

### 資料表 Schema
```sql
CREATE TABLE IF NOT EXISTS TemperatureForecasts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    regionName TEXT NOT NULL,
    dataDate TEXT NOT NULL,
    startTime TEXT,
    endTime TEXT,
    minT REAL,
    maxT REAL,
    avgT REAL,
    weather TEXT,
    weatherCode TEXT,
    pop REAL,
    comfort TEXT,
    fetchedAt TEXT NOT NULL,
    UNIQUE(regionName, dataDate, startTime, endTime)
);

CREATE INDEX IF NOT EXISTS idx_forecast_region_date
ON TemperatureForecasts(regionName, dataDate);
```

### UPSERT 參數化寫入
為防範短時間重複同步造成資料庫累積膨脹，所有寫入均採用 SQLite 參數化 UPSERT：
```sql
INSERT INTO TemperatureForecasts (
  regionName, dataDate, startTime, endTime,
  minT, maxT, avgT, weather, weatherCode, pop, comfort, fetchedAt
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(regionName, dataDate, startTime, endTime) DO UPDATE SET
  minT = excluded.minT,
  maxT = excluded.maxT,
  avgT = excluded.avgT,
  weather = excluded.weather,
  weatherCode = excluded.weatherCode,
  pop = excluded.pop,
  comfort = excluded.comfort,
  fetchedAt = excluded.fetchedAt;
```

---

## 7. 後端 API 規格說明

### 1. `GET /api/weather`
- **功能**：查詢氣象預報資料（若資料庫筆數不足 6 筆，將觸發自動預熱同步）。
- **查詢參數 (Query Params)**：
  - `region` (選填)：六大分區名稱（例如：`中部地區`）
  - `date` (選填)：預報日期（例如：`2026-10-14`）
- **回傳範例**：
  ```json
  {
    "ok": true,
    "data": [
      {
        "id": 1,
        "regionName": "中部地區",
        "dataDate": "2026-10-14",
        "startTime": "2026-10-14 18:00:00",
        "endTime": "2026-10-15 06:00:00",
        "minT": 22.0,
        "maxT": 30.0,
        "avgT": 26.0,
        "weather": "晴時多雲",
        "weatherCode": "02",
        "pop": 10.0,
        "comfort": "舒適至悶熱",
        "fetchedAt": "2026-10-14T13:38:37.560Z"
      }
    ],
    "updatedAt": "2026-10-14T13:38:37.560Z"
  }
  ```

### 2. `POST /api/weather/sync`
- **功能**：從中央氣象署 API 抓取最新七天資料並 UPSERT 至資料庫。
- **安全性**：
  - Header: `Authorization: Bearer <SYNC_SECRET>`
  - 若未通過授權，立即回傳 HTTP 401。
  - 具備 30 秒限流防護機制 (HTTP 429)，防範暴力重複更新。
- **回傳範例**：
  ```json
  {
    "ok": true,
    "inserted": 0,
    "updated": 42,
    "total": 42,
    "source": "live"
  }
  ```

### 3. `GET /api/health`
- **功能**：系統健康檢查端點。
- **回傳範例**（絕不洩漏連線密鑰）：
  ```json
  {
    "ok": true,
    "status": "healthy",
    "database": "connected",
    "count": 42,
    "updatedAt": "2026-10-14T13:38:37.560Z"
  }
  ```

---

## 8. 前端視覺元件與互動體驗
1. **WeatherFilters 篩選控制列**：
   - 預設選擇「中部地區」及最近觀測日期。
   - 支援「更新預報」與「重設篩選」。
   - 與瀏覽器 URL Search Params 雙向同步（例如：`?region=南部地區&date=2026-10-16`），使用者重整或貼上連結皆能精確復原。
2. **WeatherSummaryCards 摘要資訊卡片**：
   - 依天氣代碼動態呈現 太陽／多雲／雨滴等圖示。
   - 清楚呈現「最低溫 (°C)」、「最高溫 (°C)」、「平均溫 (°C)」、「降雨機率 (%)」與「舒適度」。
   - 缺失數值一律顯示「暫無資料」，杜絕 `NaN`、`undefined` 或 `null` 破圖。
3. **TemperatureChart 七日氣溫折線圖**：
   - 紅線代表最高溫 (`MaxT`)，藍線代表最低溫 (`MinT`)。
   - 支援滑鼠 Hover Custom Tooltip、圓點指示與淺灰網格線。
   - 具備資料查無時之友善空狀態。
4. **TaiwanWeatherMap 台灣 GIS 地圖**：
   - 使用 OpenStreetMap 圖資與 Leaflet 向量標記。
   - 標記依平均溫分級色彩：
     - `< 20°C`：藍色 (涼爽)
     - `20–25°C`：綠色 (舒適)
     - `25–30°C`：黃色 (暖熱)
     - `> 30°C`：紅色 (炎熱)
   - 點擊地圖上的區域 Pin 標記，自動聯動更新全站篩選與折線圖。
5. **ForecastTable 七日預報資料表**：
   - 包含日期、星期、天氣、低溫(藍)、高溫(紅)、平均溫(橘)、降雨機率與舒適度。
   - 支援手機版水平捲動 (`overflow-x-auto`)，表格邊界平整。

---

## 9. 本機安裝與啟動教學

### 系統環境要求
- Node.js 18.17.0 以上 (建議 Node.js 20+ 或 22+)
- npm 或 yarn

### 1. 複製專案與安裝相依套件
```bash
git clone https://github.com/damondtsai/AIIS_1014_weather_forecast.git
cd AIIS_1014_weather_forecast
npm install
```

### 2. 設定本機環境變數
```bash
cp .env.example .env.local
```
編輯 `.env.local` 檔案（未填寫 `CWA_API_KEY` 時，系統亦能以內建 Mock 資料完美演示）：
```dotenv
CWA_API_KEY=你的CWA開放資料授權碼
CWA_DATASET_ID=F-A0010-001
DATABASE_URL=file:weather.db
DATABASE_AUTH_TOKEN=
SYNC_SECRET=your-local-sync-secret
```

### 3. 本機啟動開發伺服器
```bash
npm run dev
```
開啟瀏覽器前往 [http://localhost:3000](http://localhost:3000)。

### 4. 正式版本編譯測試
```bash
npm run build
npm run start
```

---

## 10. 環境變數設定指南

| 環境變數名稱 | 必填 | 預設值 | 說明 |
| :--- | :---: | :--- | :--- |
| `CWA_API_KEY` | 建議 | *(空白)* | 中央氣象署 API 授權金鑰。未提供時自動啟動離線備援資料。 |
| `CWA_DATASET_ID`| 否 | `F-A0010-001` | 氣象署資料集代碼，固定為一週鄉鎮與區域預報。 |
| `DATABASE_URL` | 是 | `file:weather.db` | 本機開發填 `file:weather.db`；Vercel 正式環境填 Turso `libsql://...` 網址。 |
| `DATABASE_AUTH_TOKEN` | 正式環境必填 | *(空白)* | Turso 雲端資料庫之驗證權杖。本機 SQLite 時留空。 |
| `SYNC_SECRET` | 否 | *(建議填寫)* | 同步路由與 Vercel Cron 之 Bearer 驗證金鑰。 |

---

## 11. Turso 雲端資料庫建置教學
由於 Vercel 等 Serverless 平台每次請求均可能執行於不同容器，**本機 SQLite 檔案不可在生產環境中持久保存**。因此正式環境推薦使用與 SQLite 100% 相容的 Turso (libSQL)：

1. 前往 [Turso 官網](https://turso.tech/) 註冊並安裝 Turso CLI：
   ```bash
   npm install -g turso
   turso auth login
   ```
2. 建立專用氣象資料庫：
   ```bash
   turso db create taiwan-weather
   ```
3. 取得資料庫連線網址：
   ```bash
   turso db show taiwan-weather --url
   # 輸出格式範例：libsql://taiwan-weather-[帳號].turso.io
   ```
4. 產生長期有效之 Auth Token：
   ```bash
   turso db tokens create taiwan-weather
   ```
5. 將上述 URL 與 Token 分別填入 Vercel 專案後台的 `DATABASE_URL` 與 `DATABASE_AUTH_TOKEN`。

---

## 12. Vercel 部署步驟與 Cron 設定

### 部署步驟
1. 將專案 Push 至 GitHub 倉庫（確保 `.gitignore` 已排除 `.env.local` 與 `weather.db`）。
2. 登入 [Vercel 平台](https://vercel.com/)，點擊 **Add New Project**。
3. 匯入 GitHub 中的 `AIIS_1014_weather_forecast` 倉庫。
4. 在 **Environment Variables** 區塊填入：
   - `CWA_API_KEY`
   - `CWA_DATASET_ID` = `F-A0010-001`
   - `DATABASE_URL` = (你的 Turso libsql://... 網址)
   - `DATABASE_AUTH_TOKEN` = (你的 Turso Auth Token)
   - `SYNC_SECRET` = (自訂英數安全密鑰，如 `sync-sec-2026`)
5. 點擊 **Deploy**，約 1 分鐘內即可完成全自動部署。

### Vercel Cron 定時同步說明
本專案根目錄已包含 `vercel.json`：
```json
{
  "framework": "nextjs",
  "crons": [
    {
      "path": "/api/weather/sync",
      "schedule": "0 * * * *"
    }
  ]
}
```
- 每 60 分鐘定時呼叫 `/api/weather/sync`。
- Vercel Cron 會自動帶入由環境變數定義的安全標頭，避免未授權呼叫。

---

## 13. 單元測試與自動化校驗

本專案實作了嚴謹的 12 項規格自動化測試套件（涵蓋資料轉換、白名單驗證、API 邊界處理與 UI 元件空狀態）：
```bash
# 執行 ESLint 程式碼品質檢查
npm run lint

# 執行 Vitest 12 項完整單元測試
npm run test

# 執行 Next.js 生產環境編譯檢查
npm run build
```

### 12 項測試項目一覽：
1. `CWA JSON 解析測試`：確認正確解析 `F-A0010-001` 巢狀記錄。
2. `MinT／MaxT 轉換測試`：確保字串數值安全轉為浮點數。
3. `缺少 weatherElement 測試`：確認元素缺失時優雅容錯不崩潰。
4. `無效溫度測試`：確認非數值文字（如 `N/A`）轉換為 `null`。
5. `六大區域白名單測試`：確認僅許可六大標準區域，非法區域即時阻擋。
6. `平均溫度計算測試`：驗證 $\text{avgT} = (\text{minT} + \text{maxT}) / 2$ 精準度。
7. `UPSERT 不重複測試`：重複寫入相同鍵值時進行 UPDATE，總筆數不重複增長。
8. `無效 region API 測試`：GET `/api/weather?region=火星` 回傳 HTTP 400。
9. `無資料 API 測試`：查詢無資料之日期時，安全回傳空陣列 `[]`。
10. `同步 API 未授權測試`：未帶 Token 請求 POST `/api/weather/sync` 回傳 HTTP 401。
11. `日期篩選測試`：資料庫查詢準確過濾指定日期。
12. `圖表空資料測試`：Recharts 元件在無數據時安全呈現防呆文字。

---

## 14. 資安注意事項
1. **密鑰防洩漏原則**：
   - 程式原始碼、README、Git 紀錄與前端 JS Bundle **絕不包含**真實授權金鑰。
   - 嚴禁使用 `NEXT_PUBLIC_` 作為密鑰前綴。
2. **網路層防護**：
   - 瀏覽器 Network 窗格僅能觀察到呼叫 Next.js 自家 API（如 `/api/weather`），絕不直接請求氣象署 API，有效隱藏憑證。
3. **日誌防護**：
   - Server Log 輸出時強制遮蔽 URL 內的授權碼參數，杜絕日誌收集洩漏。
4. **SQL Injection 防護**：
   - 存取層全面採用 Prepared Statement 參數化查詢，絕無字串拼接 SQL。
5. **XSS 防護**：
   - Leaflet Popup 及圖表文字皆經過 React DOM 自動轉義，阻絕惡意 HTML / JS 注入。

---

## 15. 常見問題與故障排除 (FAQ)

### Q1: 本機執行時未設定 `CWA_API_KEY` 會發生什麼事？
**A:** 系統設計了優雅降級機制。若無 API Key，終端機將輸出提示並自動載入 `public/mock/cwa-weather.json`，介面上亦會顯示溫馨提示，確保所有圖表、地圖與預報表格在無金鑰狀態下仍可完美展示。

### Q2: 為什麼地圖必須使用 `dynamic` 且 `ssr: false`？
**A:** Leaflet 依賴瀏覽器專屬之全域變數 `window` 與 `document`。若在伺服器端渲染 (SSR)，會觸發 `window is not defined` 錯誤。使用 Next.js `dynamic(..., { ssr: false })` 可保證地圖僅在客戶端載入。

### Q3: Vercel 部署後重新整理出現資料消失？
**A:** 請確認正式環境已將 `DATABASE_URL` 設定為 Turso 等 libSQL 雲端服務，而非本地檔案路徑 `file:weather.db`。

---

## 16. 已知限制與未來擴充規劃
- **已知限制**：
  - CWA `F-A0010-001` 資料集主要針對台灣主要縣市與分區，離島（金門、馬祖、澎湖）在部分時段之細節指標可能未列於六大分區中。
- **未來擴充規劃**：
  - 擴充至全台 22 縣市更細微的 368 鄉鎮區七日預報。
  - 整合中央氣象署雷達回波圖 (Radar Mosaic) 圖層套疊至 Leaflet 地圖。
  - 加入 PWA (Progressive Web App) 離線快取與氣象異常推播通報。

---
**專案開發者**：Taiwan Weather Forecast 開發團隊  
**授權規範**：MIT License
