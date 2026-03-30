# StockAlertAdmin Web Vue 架構說明

本文件聚焦 `web/` 目前的 Vue 前端架構，整理元件層級、狀態、props/emits、主要方法與事件監聽。內容偏向工程結構與資料流，不展開過細的樣式或逐行實作細節。

## 快速總覽表

### 頁面與路由總覽

| 路由 | 頁面名稱 | View 元件 | 模板來源 | 主要責任 | 主要子元件 |
| --- | --- | --- | --- | --- | --- |
| `/` | Home / Stock Alert Settings | `HomeView` | `stock_alert_settings.html` | 載入設定、編輯規則、儲存設定 | 無獨立 Vue 子元件，內含 Tabulator 表格 |
| `/admin` | Admin | `AdminView` | `admin_dashboard.html` | 顯示示意統計、手動觸發操作 | `AdminOverviewPanel` |
| `/:pathMatch(.*)*` | fallback | router redirect | 無 | 未知路徑導回首頁 | 無 |

### JS / HTML 檔案角色總覽

| 檔案 | 類型 | 在架構中的角色 | 直接依賴 | 被誰使用 |
| --- | --- | --- | --- | --- |
| `index.html` | HTML shell | 載入 CDN、提供 `#app` 掛載點 | Vue、VueRouter、PrimeVue、Tabulator、`app.js` | 瀏覽器入口頁 |
| `app.js` | app 入口 | 建立 router、注入模板、註冊全域元件、mount app | `HomeView`、`AdminView`、Vue、VueRouter、PrimeVue | `index.html` |
| `views/home-view.js` | route view | 首頁狀態與主要業務流程 | Vue Composition API、`/api/config`、Tabulator | `app.js` router |
| `views/admin-view.js` | route view | 管理頁狀態與示意操作流程 | Vue Composition API、`AdminOverviewPanel` | `app.js` router |
| `components/admin-overview-panel.js` | Vue component | 顯示管理頁統計資訊、對父層 emit refresh | PrimeVue 全域元件、父層 props | `AdminView` |
| `stock_alert_settings.html` | HTML template | `HomeView` 畫面模板 | PrimeVue 標籤、Vue 指令 | `app.js` 載入後指派給 `HomeView.template` |
| `admin_dashboard.html` | HTML template | `AdminView` 畫面模板 | `admin-overview-panel`、PrimeVue 標籤、Vue 指令 | `app.js` 載入後指派給 `AdminView.template` |
| `styles.css` | CSS | 全域與各區塊樣式 | HTML class 命名 | 全站畫面 |

### Vue 元件總覽

| 元件 | 類型 | 定義位置 | 父層 | 子層 | props | emits | 主要責任 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `AppShell` | 根元件 / layout | `app.js` | 無 | `router-view` | 無 | 無 | 顯示 navbar 與路由內容 |
| `HomeView` | route view | `views/home-view.js` | `router-view` | 無獨立 Vue 子元件 | 無 | 無 | 管理規則與全域跌幅設定 |
| `AdminView` | route view | `views/admin-view.js` | `router-view` | `AdminOverviewPanel` | 無 | 無 | 管理頁狀態、手動觸發流程 |
| `AdminOverviewPanel` | 展示型子元件 | `components/admin-overview-panel.js` | `AdminView` | 無 | `stats` | `refresh` | 顯示統計卡並通知父層刷新 |

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
| `createRouter(...)` | 全站 router instance | `app.js` | 控制整個 SPA 頁面切換 |
| `router-link to="/"` | `HomeView` | Navbar | 顯示設定頁 |
| `router-link to="/admin"` | `AdminView` | Navbar | 顯示管理頁 |
| `router-view` | 依目前路由決定 | `AppShell` | 承載目前頁面元件 |

### 關聯速查

| A | 關聯 | B |
| --- | --- | --- |
| `index.html` | 載入 | `app.js` |
| `app.js` | 建立 | `AppShell` + router |
| `app.js` | 載入模板後指派給 | `HomeView.template`、`AdminView.template` |
| `HomeView` | 掛載第三方表格 | Tabulator |
| `HomeView` | 呼叫 API | `/api/config` |
| `AdminView` | 傳 `stats` props 給 | `AdminOverviewPanel` |
| `AdminOverviewPanel` | emit `refresh` 給 | `AdminView` |
| `AppShell` | 透過 `router-view` 顯示 | `HomeView` 或 `AdminView` |

## 1. 技術與執行模式

- 框架核心: Vue 3 (CDN 全域版)
- 路由: Vue Router 4 (`hash` mode)
- UI 套件: PrimeVue (CDN，全域註冊元件)
- 表格: Tabulator (直接操作 DOM)
- 模板載入: `app.js` 啟動時 `fetch` 兩份 HTML 模板，再指派給對應 view

重點特性:

- 不是 `.vue` SFC 專案，沒有 bundler/build step。
- `index.html` 只提供 shell 與 script 載入，真實頁面模板來自:
  - `stock_alert_settings.html`
  - `admin_dashboard.html`

## 2. 目錄與角色分工

- `index.html`: SPA 容器 (`#app`) 與 CDN 依賴載入
- `app.js`: 應用入口，負責路由、模板注入、全域元件註冊、掛載 app
- `views/home-view.js`: 首頁設定頁核心邏輯（規則編輯、載入/儲存）
- `views/admin-view.js`: 管理頁邏輯（示意統計 + 手動觸發流程）
- `components/admin-overview-panel.js`: 管理頁可重用子元件
- `stock_alert_settings.html`: HomeView 模板
- `admin_dashboard.html`: AdminView 模板
- `styles.css`: 全域與元件視覺樣式

## 3. 路由與頁面對應

定義於 `app.js`:

- `/` -> `HomeView`
- `/admin` -> `AdminView`
- `/:pathMatch(.*)*` -> redirect `/`

Router 使用 `createWebHashHistory()`，URL 形式為 `/#/`、`/#/admin`，避免後端額外處理前端路由重寫。

## 4. 元件層級 (Component Tree)

```text
index.html (#app)
└─ AppShell (in app.js)
   ├─ Navbar
   │  ├─ router-link -> /
   │  └─ router-link -> /admin
   └─ <router-view>
      ├─ HomeView (views/home-view.js)
      │  ├─ Global Long-Term Drop form
      │  ├─ Rules section (Tabulator mount point: ref tableEl)
      │  ├─ Action bar (Add / Reset / Save)
      │  └─ Toast stack
      └─ AdminView (views/admin-view.js)
         ├─ AdminOverviewPanel (components/admin-overview-panel.js)
         └─ Manual Trigger Panel
```

## 5. 每個元件的狀態、Props、事件、方法

## 5.1 AppShell (`app.js`)

性質:

- 根元件（layout shell）
- 不保存業務狀態

主要職責:

- 顯示共用導覽列
- 透過 `<router-view />` 承載頁面元件

監聽/互動:

- 使用 `router-link` 導頁，無自訂 methods

## 5.2 HomeView (`views/home-view.js`)

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

## 5.3 AdminView (`views/admin-view.js`)

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
  - 執行時切換 `triggerBusy`、`triggerStatus`、`triggerMessage`
- `simulateBackendCall(enabled)` (檔案內 helper)
  - 模擬後端成功/失敗與延遲

主要事件監聽:

- `@change="updateTriggerEnabled($event.target.checked)"`
- `@click="triggerAdminAction"`
- `@refresh="refreshDemoData"` (來自子元件 emit)

## 5.4 AdminOverviewPanel (`components/admin-overview-panel.js`)

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

- PrimeVue 元件由 `app.component(...)` 全域註冊，目前包含:
  - `p-card`
  - `p-button`
  - `p-inputnumber`
  - `p-tag`
- Tabulator 為非 Vue 生態元件，採 DOM 掛載模式，需注意:
  - 初始化時機 (`nextTick` + `ref`)
  - 狀態同步責任由程式手動維護 (`syncFromTable`)

## 8. 現行架構摘要

- 架構屬於「輕量 SPA + 模板外載」模式。
- View 層 (`HomeView`, `AdminView`) 負責頁面狀態與流程。
- `AdminOverviewPanel` 已切成可重用子元件，具備基本父子通訊模式（props + emits）。
- Home 頁最關鍵的複雜度來自 Vue 與 Tabulator 的雙資料來源同步。

## 9. 與整個專案對照後的確認結果

本文件已對照整個 `StockAlertAdmin/` 專案，目前結論是: 內容大致 match，可作為詳細的前端架構文件使用，但若用在交接或長期維護，應同時把前後端邊界一併理解。

### 9.1 已確認 match 的部分

- `web/` 內實際前端入口只有 `index.html` + `app.js` 這一套 SPA 組合。
- Router 實際只有兩個頁面路由:
  - `/`
  - `/admin`
- Vue view/component 數量與文件一致:
  - `HomeView`
  - `AdminView`
  - `AdminOverviewPanel`
- `HomeView` 的確只串接一個真實後端 API: `/api/config`
- `AdminView` 的手動觸發流程目前的確是 demo flow，沒有對應 Flask API route。
- 模板載入模式也與文件一致: `app.js` 啟動時以 `fetch()` 載入兩份 HTML 模板再注入 view。

### 9.2 掃描整個專案後補上的跨層關聯

雖然本文件主體聚焦 `web/`，但前端實際執行要依賴 `backend/app.py` 的兩個關鍵行為:

- Flask 將 `web/` 設為 `static_folder`
- 根路徑 `/` 直接回傳 `index.html`

也就是說，這個前端不是獨立部署的 dev server 模式，而是由 Flask 直接提供靜態檔與 API。

實際專案中的前後端銜接如下:

| 專案層 | 檔案/路徑 | 責任 | 與前端的關聯 |
| --- | --- | --- | --- |
| Backend | `backend/app.py` | 提供 Flask app、靜態頁面、API | 前端所有頁面都由這個 app 提供 |
| Backend | `GET /api/config` | 回傳 `long_term_drop` + `rules` | `HomeView.loadConfig()` 使用 |
| Backend | `POST /api/config` | 驗證並儲存設定 | `HomeView.save()` 使用 |
| Backend | `backend/models.py` | SQLite 連線 | 前端不直接使用，但 API 資料來源在此 |
| Frontend | `web/index.html` | 啟動前端 shell | 由 Flask `/` 提供 |
| Frontend | `web/app.js` | 啟動 Vue SPA | 從 `index.html` 載入 |

### 9.3 作為前端架構文件時，哪些地方已足夠

如果你的目的是以下用途，這份文件已經夠用:

- 快速理解 `web/` 的頁面與元件組成
- 了解 router、state、props/emits、主要 methods
- 知道哪裡是真實 API、哪裡只是 demo component
- 了解 Vue 與 Tabulator 的同步責任落點

### 9.4 作為完整交接文件時，還要一併注意的邊界

這份文件可以當「詳細前端架構文件」，但它不是完整的「前端 + 後端整合設計文件」，原因如下:

- 沒有完整展開 Flask route / SQLite schema 細節
- 沒有描述部署時 `backend/app.py` 如何提供 `web/` 靜態檔
- 沒有記錄非首頁頁面若未來改成真實 API 時的契約設計

因此比較精準的定位是:

- 對 `web/` 來說: 可以當詳細前端架構文件
- 對整個 `StockAlertAdmin` 來說: 可以當前端架構主文件，但仍需搭配 backend / API 文件一起看

### 9.5 一句話結論

這份 `VUE_ARCHITECTURE.md` 和目前專案實作是 match 的，已足以作為 `web/` 的詳細前端架構文件；若要用於完整專案交接，建議把它視為「前端主文件 + 後端 API 補充閱讀」的組合。