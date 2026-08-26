# StockAlertAdmin Web Vue 架構說明

本文件聚焦 `web/` 目前的 Vue 前端架構，整理元件層級、狀態、props/emits、主要方法與事件監聽。內容偏向工程結構與資料流，不展開過細的樣式或逐行實作細節。

目前前端採用 Vue 3 + Vite + Single-File Components (SFC)。本文件中的 `src/` 路徑均相對於 `web/`。

## 快速總覽表

### 頁面與路由總覽

| 路由 | 頁面名稱 | View SFC | 主要責任 | 主要子元件 |
| --- | --- | --- | --- | --- |
| `/` | Home / Stock Alert Settings | `src/views/HomeView.vue` | 載入設定、編輯規則、儲存設定 | 無獨立 Vue 子元件，內含 Tabulator 表格 |
| `/admin` | Admin | `src/views/AdminView.vue` | 顯示示意統計、手動觸發操作 | `AdminOverviewPanel` |
| `/:pathMatch(.*)*` | fallback | router redirect | 未知路徑導回首頁 | 無 |

### 前端檔案角色總覽

| 檔案 | 類型 | 在架構中的角色 | 直接依賴 | 被誰使用 |
| --- | --- | --- | --- | --- |
| `index.html` | HTML entry | 提供 `#app` 掛載點並載入 `/src/main.js` | Vite、Google Fonts | 瀏覽器入口頁 |
| `src/main.js` | app 入口 | 建立 app、安裝 router/PrimeVue、註冊全域元件、載入樣式並 mount | `App.vue`、`router/index.js`、PrimeVue、Tabulator CSS | `index.html` |
| `src/App.vue` | root SFC | 提供共用 navbar 與 `<router-view />` | Vue Router 元件 | `main.js` |
| `src/router/index.js` | router module | 定義 hash router 與頁面對應 | Vue Router、`HomeView.vue`、`AdminView.vue` | `main.js` |
| `src/views/HomeView.vue` | route view SFC | 首頁狀態與規則設定流程 | Vue Composition API、`configService`、Tabulator | `router/index.js` |
| `src/views/AdminView.vue` | route view SFC | 管理頁狀態與手動觸發流程 | Vue Composition API、`adminService`、`AdminOverviewPanel.vue` | `router/index.js` |
| `src/components/AdminOverviewPanel.vue` | child SFC | 顯示管理頁統計資訊並 emit `refresh` | PrimeVue 全域元件、父層 props | `AdminView.vue` |
| `src/services/api.js` | API utility | 統一處理 fetch、JSON 與錯誤 | Browser Fetch API | `configService.js`、`adminService.js` |
| `src/services/configService.js` | service module | 封裝 `/api/config` 讀寫 | `api.js` | `HomeView.vue` |
| `src/services/adminService.js` | service module | 封裝 `/api/admin/trigger-job` | `api.js` | `AdminView.vue` |
| `src/assets/styles.css` | CSS | 全域與各區塊樣式 | HTML class 命名 | `main.js` |
| `package.json` / `vite.config.js` | project config | 定義 npm scripts、依賴、SFC plugin、alias、dev proxy 與 build 輸出 | Vite、`@vitejs/plugin-vue` | npm/Vite |

目前仍保留的 `app.js`、`views/*.js`、`components/*.js`、`stock_alert_settings.html` 與 `admin_dashboard.html` 是遷移前的 legacy 檔案；目前 `index.html` 不再載入它們，也不應視為執行中的入口或模板來源。

### Vue 元件總覽

| 元件 | 類型 | 定義位置 | 父層 | 子層 | props | emits | 主要責任 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `App` | 根元件 / layout | `src/App.vue` | 無 | `router-view` | 無 | 無 | 顯示 navbar 與路由內容 |
| `HomeView` | route view SFC | `src/views/HomeView.vue` | `router-view` | 無獨立 Vue 子元件 | 無 | 無 | 管理規則與全域跌幅設定 |
| `AdminView` | route view SFC | `src/views/AdminView.vue` | `router-view` | `AdminOverviewPanel` | 無 | 無 | 管理頁狀態、手動觸發流程 |
| `AdminOverviewPanel` | 展示型子元件 SFC | `src/components/AdminOverviewPanel.vue` | `AdminView` | 無 | `stats` | `refresh` | 顯示統計卡並通知父層刷新 |

### 主要狀態總覽

| 所屬元件 | 狀態名稱 | 型別 | 用途 | 與誰互動 |
| --- | --- | --- | --- | --- |
| `HomeView` | `rules` | `ref([])` | 儲存規則資料列 | Tabulator、`save()`、`loadConfig()` |
| `HomeView` | `longTermDrop` | `reactive({...})` | 儲存全域長期跌幅設定 | PrimeVue `p-inputnumber`、`save()`、`loadConfig()` |
| `HomeView` | `notifications` | `ref([])` | 儲存 toast 顯示資料 | `showToast()`、`removeToast()`、template `v-for` |
| `HomeView` | `tableEl` | `ref(null)` | 指向 Tabulator 掛載 DOM | `buildTable()` |
| `HomeView` | `table` | 非 reactive 變數 | Tabulator instance | `buildTable()`、`syncFromTable()`、`addRule()` |
| `AdminView` | `stats` | `ref({...})` | 管理頁統計數據 | 傳給 `AdminOverviewPanel` |
| `AdminView` | `triggerEnabled` | `ref(false)` | 手動觸發是否啟用 | checkbox、`triggerAdminAction()` |
| `AdminView` | `triggerBusy` | `ref(false)` | 控制按鈕 loading / disabled | trigger button |
| `AdminView` | `triggerStatus` | `ref('idle')` | 顯示目前流程狀態 | 狀態 badge、訊息樣式 |
| `AdminView` | `triggerMessage` | `ref('...')` | 顯示操作結果文字 | trigger panel template |

### ref / reactive / 非 reactive 對照

| 類別 | 目前使用項目 | 目的 |
| --- | --- | --- |
| `ref` | `rules`, `notifications`, `tableEl`, `stats`, `triggerEnabled`, `triggerBusy`, `triggerStatus`, `triggerMessage` | 管理單值、陣列、DOM ref，或需整體替換的物件 |
| `reactive` | `longTermDrop` | 管理表單型物件，直接綁定多個欄位 |
| 非 reactive | `table`, `notificationId` | 第三方實例或純內部計數器，不直接驅動畫面 |

### Router 與畫面關聯

| Router 層 | 對應元件 | 導頁來源 | 畫面結果 |
| --- | --- | --- | --- |
| `createRouter(...)` | 全站 router instance | `src/router/index.js` | 控制整個 SPA 頁面切換 |
| `router-link to="/"` | `HomeView` | Navbar | 顯示設定頁 |
| `router-link to="/admin"` | `AdminView` | Navbar | 顯示管理頁 |
| `router-view` | 依目前路由決定 | `App` | 承載目前頁面元件 |

### 關聯速查

| A | 關聯 | B |
| --- | --- | --- |
| `index.html` | 載入 | `src/main.js` |
| `src/main.js` | 建立與掛載 | `App.vue` + router + PrimeVue |
| `src/router/index.js` | 對應 | `HomeView.vue`、`AdminView.vue` |
| `App.vue` | 透過 | `router-view` 承載目前頁面 |
| `HomeView` | 掛載第三方表格 | Tabulator |
| `HomeView` | 呼叫 | `configService` -> `api.js` -> `/api/config` |
| `AdminView` | 呼叫 | `adminService` -> `api.js` -> `/api/admin/trigger-job` |
| `AdminView` | 傳 `stats` props 給 | `AdminOverviewPanel` |
| `AdminOverviewPanel` | emit `refresh` 給 | `AdminView` |
| `App` | 透過 `router-view` 顯示 | `HomeView` 或 `AdminView` |

## 1. 技術與執行模式

- 框架核心: Vue 3 Single-File Components (SFC)
- 建置工具: Vite
- 路由: Vue Router 4 (`hash` mode)
- UI 套件: PrimeVue，透過 npm 安裝，並在 `src/main.js` 全域註冊目前使用的元件
- 表格: Tabulator，透過 npm module import，仍採直接操作 DOM 的掛載模式
- API 層: `src/services/` 封裝 Fetch API，View 不直接處理請求細節

執行流程:

- `index.html` 提供 `#app` 掛載點並載入 `/src/main.js`。
- `src/main.js` 建立 Vue app，安裝 router 與 PrimeVue，載入全域樣式後掛載 `App.vue`。
- `App.vue` 提供共用導覽列與 `<router-view />`；頁面元件由 `src/router/index.js` 對應。
- 開發時執行 `npm run dev`，Vite 提供 HMR，並將 `/api/*` 代理至 Flask (`http://127.0.0.1:5000`)。
- 正式環境執行 `npm run build`，Vite 將編譯後的靜態資源輸出至 `web/dist/`，由 Flask 提供服務。

目前不再透過 `fetch` 動態載入 HTML template；每個 View 的 template 與 script 集中在 `.vue` SFC，樣式則由 SFC 或 `src/assets/styles.css` 提供。

## 2. 目錄與角色分工

- `index.html`: Vite HTML entry，提供 SPA 容器 (`#app`) 並載入 `src/main.js`
- `src/main.js`: 應用入口，負責建立 app、安裝 router/PrimeVue、註冊全域元件、載入樣式與掛載 app
- `src/App.vue`: 根元件，負責共用導覽列與 `<router-view />`
- `src/router/index.js`: hash router 與路由對應
- `src/views/HomeView.vue`: 首頁設定頁核心邏輯（規則編輯、載入/儲存）
- `src/views/AdminView.vue`: 管理頁邏輯（示意統計 + 手動觸發流程）
- `src/components/AdminOverviewPanel.vue`: 管理頁可重用展示型子元件
- `src/services/api.js`: 共用 API request、JSON 解析與錯誤處理
- `src/services/configService.js`: 封裝 `/api/config` 讀寫
- `src/services/adminService.js`: 封裝 `/api/admin/trigger-job`
- `src/assets/styles.css`: 全域與各區塊視覺樣式
- `package.json`: npm scripts 與前端依賴
- `vite.config.js`: Vue plugin、`@` alias、開發代理與 build 輸出設定

## 3. 路由與頁面對應

定義於 `src/router/index.js`:

- `/` -> `HomeView`
- `/admin` -> `AdminView`
- `/:pathMatch(.*)*` -> redirect `/`

Router 使用 `createWebHashHistory()`，URL 形式為 `/#/`、`/#/admin`，避免後端額外處理前端路由重寫。

## 4. 元件層級 (Component Tree)

```text
index.html (#app)
└─ App (src/App.vue)
   ├─ Navbar
   │  ├─ router-link -> /
   │  └─ router-link -> /admin
   └─ <router-view>
      ├─ HomeView (src/views/HomeView.vue)
      │  ├─ Global Long-Term Drop form
      │  ├─ Rules section (Tabulator mount point: ref tableEl)
      │  ├─ Action bar (Add / Reset / Save)
      │  └─ Toast stack
      └─ AdminView (src/views/AdminView.vue)
         ├─ AdminOverviewPanel (src/components/AdminOverviewPanel.vue)
         └─ Manual Trigger Panel
```

## 5. 每個元件的狀態、Props、事件、方法

## 5.1 App (`src/App.vue`)

性質:

- 根元件（layout shell）
- 不保存業務狀態

主要職責:

- 顯示共用導覽列
- 透過 `<router-view />` 承載頁面元件

監聽/互動:

- 使用 `router-link` 導頁，無自訂 methods

## 5.2 HomeView (`src/views/HomeView.vue`)

API 風格:

- Composition API (`setup`)

狀態 (State):

- `rules: ref([])`
  - 規則資料陣列，每筆格式:
    - `symbol`
    - `x_days`
    - `y_percent`
- `longTermDrop: reactive({ days, drop_percent })`
  - 全域長期跌幅設定
- `notifications: ref([])`
  - toast 顯示陣列
- `tableEl: ref(null)`
  - Tabulator 掛載 DOM 節點
- `table` (非 reactive 變數)
  - Tabulator instance
- `notificationId` (非 reactive)
  - toast 唯一編號遞增器

Props / Emits:

- 無 props
- 無 emits

生命週期:

- `onMounted(loadConfig)`
  - 頁面掛載後立即從 `/api/config` 載入設定

對外可用 methods (回傳給 template):

- `addRule()`
- `loadConfig()`
- `save()`
- `removeToast(id)`

內部核心 methods:

- `showToast(severity, summary, detail, life)`
- `normalizeRules(rows)`
- `validateRules(rows)`
- `syncFromTable()`
- `buildTable()`

主要事件監聽與觸發:

- 模板事件:
  - `@click="addRule"`
  - `@click="loadConfig"` (Reset)
  - `@click="save"` (Save Settings)
  - `@click="removeToast(item.id)"`
- Tabulator 事件:
  - `cellEdited` -> `syncFromTable()`
  - delete button `cellClick` -> 刪列 + `syncFromTable()`
- 非同步流程:
  - `GET /api/config` 讀取設定
  - `POST /api/config` 儲存設定

狀態流重點:

- Vue 狀態與 Tabulator 不是同一套 reactivity，需要 `syncFromTable()` 手動同步。
- `loadConfig()` 在資料寫入後使用 `nextTick()`，確保 DOM ready 再初始化或更新 Tabulator。

## 5.3 AdminView (`src/views/AdminView.vue`)

API 風格:

- Composition API (`setup`)

子元件:

- `AdminOverviewPanel`

狀態 (State):

- `stats: ref({ activeUsers, trackedSymbols, alertsSent })`
- `triggerEnabled: ref(false)`
- `triggerBusy: ref(false)`
- `triggerStatus: ref('idle')`
  - 狀態值: `idle | running | success | error`
- `triggerMessage: ref('...')`

Props / Emits:

- 自身無 props / emits（作為 route view）
- 對子元件傳遞:
  - `:stats="stats"`
- 監聽子元件事件:
  - `@refresh="refreshDemoData"`

主要 methods:

- `refreshDemoData()`
  - 更新示意統計數字
- `updateTriggerEnabled(value)`
  - 同步 checkbox 值到 `triggerEnabled`
- `triggerAdminAction()`
  - 管理頁手動觸發主流程
  - POST `/api/admin/trigger-job` 並帶入 `force_send_report: triggerEnabled.value`
  - 執行時切換 `triggerBusy`、`triggerStatus`、`triggerMessage`
  - 成功時顯示後端訊息，失敗時顯示錯誤訊息

主要事件監聽:

- `@change="updateTriggerEnabled($event.target.checked)"`
- `@click="triggerAdminAction"`
- `@refresh="refreshDemoData"` (來自子元件 emit)

## 5.4 AdminOverviewPanel (`src/components/AdminOverviewPanel.vue`)

API 風格:

- Options API

Props:

- `stats` (Object, required)
  - 期望欄位:
    - `activeUsers`
    - `trackedSymbols`
    - `alertsSent`

Emits:

- `refresh`

本地狀態:

- 無本地 reactive state（純展示 + 事件轉發）

模板事件:

- Refresh 按鈕 `@click="$emit('refresh')"`

設計定位:

- Presentation/Display component
- 不直接操作 API，不持有業務資料來源

## 6. 跨層資料與互動關係

Home 頁:

- 使用者操作表單/表格 -> 更新 Vue state (`rules`, `longTermDrop`)
- `save()` 組合 payload -> `POST /api/config`
- `loadConfig()` 從 `GET /api/config` 回填狀態

Admin 頁:

- `AdminView` 持有狀態
- `AdminOverviewPanel` 只收 `stats` 與回拋 `refresh`
- 手動觸發區塊由 `AdminView` 單向管理忙碌與結果狀態

## 7. 外部依賴與 Vue 整合注意點

- PrimeVue 元件由 `src/main.js` 的 `app.component(...)` 全域註冊，目前包含:
  - `p-card`
  - `p-button`
  - `p-inputnumber`
  - `p-tag`
- 依賴透過 `package.json` 管理；執行 `npm ci` 安裝依賴，執行 `npm run build` 產生 `dist/`。
- `@` alias 指向 `src/`，因此元件與服務可使用 `@/components/...`、`@/services/...` 等 import 路徑。
- Tabulator 為非 Vue 生態元件，採 DOM 掛載模式，需注意:
  - 初始化時機 (`nextTick` + `ref`)
  - 狀態同步責任由程式手動維護 (`syncFromTable`)
- API 呼叫集中在 service layer:
  - `configService.js` -> `api.js` -> `/api/config`
  - `adminService.js` -> `api.js` -> `/api/admin/trigger-job`

## 8. 現行架構摘要

- 架構屬於「Vue 3 SFC + Vite + hash router」模式。
- `App.vue` 是根 layout；View 層 (`HomeView`, `AdminView`) 負責頁面狀態與流程。
- `AdminOverviewPanel.vue` 是可重用展示型子元件，具備基本父子通訊模式（props + emits）。
- API 呼叫由 `src/services/` 集中管理，避免 View 直接散落 fetch 邏輯。
- Home 頁最關鍵的複雜度仍來自 Vue 與 Tabulator 的雙資料來源同步。
