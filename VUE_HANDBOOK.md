# Vue 3 學習手冊
### 以 StockAlert Admin 專案為例，從零開始理解 Vue

---

> **本手冊閱讀方式**  
> 每個概念都會先解釋「是什麼」，再直接對照本專案的實際程式碼，讓你同時學 Vue 又看懂這包程式。  
> 遇到 📌 符號表示這是本專案直接用到的地方；遇到 💡 符號表示延伸知識。

---

## 目錄

1. [Vue 是什麼？為什麼要用它？](#1-vue-是什麼為什麼要用它)
2. [Vue 的啟動流程：createApp 與 mount](#2-vue-的啟動流程createapp-與-mount)
3. [元件 Component：Vue 的基本積木](#3-元件-component-vue-的基本積木)
4. [Composition API 的核心：setup()](#4-composition-api-的核心setup)
5. [響應式資料：ref 與 reactive](#5-響應式資料ref-與-reactive)
6. [模板語法：讓 JS 狀態驅動畫面](#6-模板語法讓-js-狀態驅動畫面)
7. [事件處理：@ 指令](#7-事件處理-指令)
8. [生命週期：onMounted 與 nextTick](#8-生命週期onmounted-與-nexttick)
9. [Props：父元件傳資料給子元件](#9-props父元件傳資料給子元件)
10. [Emits：子元件通知父元件](#10-emits子元件通知父元件)
11. [Vue Router：前端頁面切換](#11-vue-router前端頁面切換)
12. [全域元件註冊：app.component()](#12-全域元件註冊appcomponent)
13. [Options API vs Composition API](#13-options-api-vs-composition-api)
14. [本專案架構全覽](#14-本專案架構全覽)

---

## 1. Vue 是什麼？為什麼要用它？

### 傳統網頁的問題

在沒有 Vue 之前，如果你想讓畫面跟著資料更新，大概會這樣寫：

```html
<span id="count">0</span>
<button onclick="increment()">+1</button>

<script>
  let count = 0;
  function increment() {
    count++;
    document.getElementById('count').textContent = count; // 手動更新 DOM
  }
</script>
```

每次資料變了，你都要**手動找到 DOM 元素，再手動更新它**。  
頁面越複雜，這種手動更新就越難管理，而且容易出錯。

### Vue 的解法：響應式（Reactivity）

Vue 的核心概念是：**你只管資料，畫面自己跟著更新**。

```html
<!-- Vue 版本 -->
<span>{{ count }}</span>
<button @click="count++">+1</button>
```

你只要改 `count` 這個變數，`{{ count }}` 顯示的數字就自動更新了。  
這個「資料變了畫面自動跟著變」的特性，叫做**響應式（Reactivity）**。

### 本專案如何載入 Vue？

📌 **`index.html`**

```html
<!-- 透過 CDN 一行引入 Vue 3 -->
<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
```

這種方式叫做 **CDN 全域版**，不需要安裝 Node.js、不需要 build step，  
引入後 `Vue` 這個物件就直接掛在瀏覽器的全域 `window` 上，任何 JS 都能使用。

💡 **延伸知識**：正式的大型專案通常會用 `npm install vue` 搭配 Vite 建置工具，  
並把每個元件寫在獨立的 `.vue` 檔案（Single File Component）。  
本專案選擇 CDN 版的原因是：**不需要任何安裝，直接開瀏覽器就能跑**，適合快速原型或小型管理後台。

---

## 2. Vue 的啟動流程：createApp 與 mount

### 概念解說

Vue 應用程式的啟動需要兩個動作：
1. **`createApp(根元件)`** — 建立整個 Vue 應用程式
2. **`app.mount('#app')`** — 告訴 Vue「在 HTML 的哪個位置接管畫面」

### 本專案的實作

📌 **`index.html`**

```html
<body>
  <!-- 這個 div 是 Vue 接管的範圍 -->
  <div id="app"></div>

  <!-- 用 type="module" 讓 JS 可以使用 import/export -->
  <script type="module" src="app.js"></script>
</body>
```

📌 **`app.js`**（簡化版）

```js
const { createApp } = Vue;  // 從全域 Vue 物件取出 createApp

const app = createApp(AppShell);  // 用根元件 AppShell 建立應用程式
app.use(router);                   // 安裝路由器
app.mount('#app');                  // 掛到 id="app" 的 div
```

### 視覺化理解

```
index.html
  └── <div id="app">        ← Vue 接管這裡
        └── AppShell        ← 根元件（整個 app 的外框）
              └── <router-view>   ← 根據網址顯示不同頁面
                    ├── HomeView   (網址 /#/)
                    └── AdminView  (網址 /#/admin)
```

💡 **延伸知識**：`mount('#app')` 之後，Vue 會**完全接管**這個 div 裡面的所有 HTML，  
原本 div 裡的靜態內容（如果有的話）會被 Vue 的渲染結果取代。

---

## 3. 元件 Component：Vue 的基本積木

### 概念解說

元件（Component）就像**樂高積木**。  
你可以把一塊畫面拆成一個元件，讓它：
- 有自己的資料（state）
- 有自己的樣式（template）
- 可以重複使用

### 元件的基本結構

一個 Vue 元件的最小結構：

```js
const MyComponent = {
  template: `<div>Hello, {{ name }}</div>`,
  setup() {
    const name = ref('Vue');
    return { name };
  }
};
```

### 本專案的元件組成

📌 本專案共有 4 個元件：

| 元件名稱 | 定義在哪 | 是完整頁面還是小塊元件 |
|---|---|---|
| `AppShell` | `app.js` 內直接定義 | 外框（layout），不是完整頁 |
| `HomeView` | `views/home-view.js` | 完整頁面 |
| `AdminView` | `views/admin-view.js` | 完整頁面 |
| `AdminOverviewPanel` | `components/admin-overview-panel.js` | 小塊子元件 |

📌 **`AppShell`** 定義範例（來自 `app.js`）：

```js
const AppShell = {
  template: `
    <div>
      <nav class="app-nav">
        <!-- 導覽列 ... -->
      </nav>
      <router-view />   <!-- 頁面內容放這裡 -->
    </div>
  `,
};
```

📌 **`HomeView`** 的模板是從外部 HTML 檔案載入的（`stock_alert_settings.html`）：

```js
// app.js 啟動時
HomeView.template = homeTemplate;  // 把 fetch 回來的 HTML 字串直接指定給它
```

💡 **延伸知識**：把 template 放在獨立的 `.html` 檔案，是本專案為了**讓 HTML 和 JS 好讀、好維護**而採用的巧妙做法。  
這在 `.vue` SFC（Single File Component）專案中不需要這樣做，因為 `.vue` 檔本身就把 template/script/style 寫在一起。

---

## 4. Composition API 的核心：setup()

### 概念解說

`setup()` 是 Vue 3 Composition API 的**入口函式**。  
所有這個元件的資料、函式、生命週期邏輯，全部都寫在 `setup()` 裡面。

最後用 `return { ... }` 把需要在 template 使用的東西暴露出來。

**關鍵概念：template 只能看到 return 裡有列出的東西。**

### 本專案的 setup() 結構

📌 **`views/home-view.js`**：

```js
const { ref, reactive, onMounted, nextTick } = Vue;

export default {
  setup() {
    // 1. 宣告響應式資料
    const rules = ref([]);
    const longTermDrop = reactive({ days: 60, drop_percent: 10 });
    const notifications = ref([]);
    const tableEl = ref(null);
    let table = null;         // 非響應式，普通變數

    // 2. 定義函式
    const addRule = () => { /* ... */ };
    const save = async () => { /* ... */ };
    const loadConfig = async () => { /* ... */ };

    // 3. 生命週期
    onMounted(loadConfig);

    // 4. 暴露給 template
    return {
      rules,
      longTermDrop,
      addRule,
      loadConfig,
      save,
      tableEl,
      notifications,
      removeToast,
    };
  },
};
```

### 為什麼要用 return？

```js
setup() {
  const secret = ref('不想讓 template 知道的變數');
  const visible = ref('template 可以用的變數');

  return { visible };  // secret 沒有 return，template 就無法存取
}
```

這個設計讓元件可以**控制哪些資料是「對外公開」的**，其餘純粹是內部邏輯的輔助變數可以不 return。

💡 **延伸知識**：Vue 3 後來還新增了 `<script setup>` 語法（只在 `.vue` SFC 中可用），  
讓你不需要手動 `return`，所有在 `setup` 裡宣告的東西都自動暴露給 template。  
本專案因為是 CDN 模式，用的是舊式 `setup()` 函式寫法。

---

## 5. 響應式資料：ref 與 reactive

### 概念解說

Vue 的響應式系統讓你的 JS 變數「被 Vue 追蹤」。  
當這些變數改變時，用到它的畫面就會自動重新渲染。

如果用普通 JS 變數（`let x = 1`），它改變時 Vue 不知道，畫面不會更新。

### ref — 包裝單一值

`ref()` 把任何值（數字、字串、陣列、物件）包裝成一個響應式容器。

```js
const count = ref(0);

// 在 JS 中存取/修改：要加 .value
console.log(count.value);  // 0
count.value = 5;            // 改成 5，畫面自動更新

// 在 template 中：Vue 自動解包，不需要 .value
// {{ count }}   ← 直接寫，不用寫 count.value
```

📌 **本專案範例**（`home-view.js`）：

```js
const rules = ref([]);          // 一開始是空陣列
const notifications = ref([]);  // Toast 訊息陣列
const tableEl = ref(null);      // DOM 元素的 ref（後面會解釋）
```

### reactive — 包裝物件

`reactive()` 把一整個物件變成響應式。  
與 `ref` 不同：在 JS 中**不需要** `.value`，直接存取屬性即可。

```js
const form = reactive({ name: '', age: 0 });

form.name = 'Alice';  // 直接改屬性，不需要 .value
form.age = 25;
```

📌 **本專案範例**（`home-view.js`）：

```js
const longTermDrop = reactive({ days: 60, drop_percent: 10 });

// 修改時直接存取屬性
longTermDrop.days = 90;
longTermDrop.drop_percent = 15;
```

### ref vs reactive 選哪個？

| 情境 | 推薦 |
|---|---|
| 單一值（數字、字串、布林） | `ref` |
| 整組表單欄位（物件） | `reactive` |
| 陣列 | `ref`（彈性較高） |
| DOM 元素的引用 | `ref` |

📌 **本專案的選擇原則**（來自 `VUE_ARCHITECTURE.md`）：

```
ref      → rules, notifications, tableEl, stats, triggerEnabled, triggerBusy ...
reactive → longTermDrop  （整個表單物件，欄位多、直接綁定方便）
普通變數  → table, notificationId  （不需要 Vue 追蹤，不影響畫面）
```

### 什麼時候「不該」用響應式？

📌 **`home-view.js`** 中的 Tabulator 實例：

```js
let table = null;  // 普通變數，不是 ref
```

因為 Tabulator 是第三方套件直接操作 DOM，它的狀態不需要被 Vue 追蹤，  
而且把大型物件放入 Vue 的響應式系統可能會有效能問題。  
類似的情況還有純粹的計數器 `let notificationId = 0`。

---

## 6. 模板語法：讓 JS 狀態驅動畫面

模板（template）裡有一套 Vue 特有的語法，用來把 JS 的資料「接」到 HTML 上。

### 6.1 插值語法 `{{ }}`

把 JS 變數的值顯示在畫面上。

```html
<span>{{ count }}</span>
<strong>{{ stats.activeUsers }}</strong>
```

📌 **本專案範例**（`stock_alert_settings.html`）：

```html
<!-- rules 是 ref([])，顯示陣列長度 -->
<p-tag :value="rules.length + ' RULES'" severity="secondary" :rounded="true" />
```

📌 **`admin-overview-panel.js`**（template 字串內）：

```html
<strong>{{ stats.activeUsers }}</strong>
<strong>{{ stats.trackedSymbols }}</strong>
<strong>{{ stats.alertsSent }}</strong>
```

### 6.2 v-model — 雙向綁定

`v-model` 是「資料 ↔ 輸入框」的雙向連結。  
- 使用者改輸入框 → JS 變數跟著改  
- JS 變數改 → 輸入框顯示跟著改

```html
<input v-model="searchText" />
<!-- 等價於 -->
<input :value="searchText" @input="searchText = $event.target.value" />
```

📌 **本專案範例**（`stock_alert_settings.html`）：

```html
<!-- v-model 把 longTermDrop.days 綁定到這個數字輸入框 -->
<p-inputnumber
  v-model="longTermDrop.days"
  :min="1" :use-grouping="false"
/>
```

### 6.3 v-for — 清單渲染

根據陣列自動產生多個元素，像迴圈一樣。

```html
<li v-for="item in items" :key="item.id">
  {{ item.name }}
</li>
```

`:key` 是每一筆的**唯一識別碼**，幫助 Vue 在資料更新時知道哪筆是哪筆，  
避免 DOM 錯位，這個屬性是必填的好習慣。

📌 **本專案範例**（`stock_alert_settings.html`）：

```html
<!-- notifications 是 ref([])，有幾筆 toast 就渲染幾個 div -->
<div
  v-for="item in notifications"
  :key="item.id"
  class="app-toast"
  :class="'app-toast-' + item.severity"
>
  <strong>{{ item.summary }}</strong>
  <span>{{ item.detail }}</span>
  <button @click="removeToast(item.id)">X</button>
</div>
```

### 6.4 v-bind（縮寫 `:`）— 動態屬性

把 HTML 屬性的值換成 JS 表達式。

```html
<!-- 靜態（純字串） -->
<div class="app-toast-success"></div>

<!-- 動態（JS 表達式） -->
<div :class="'app-toast-' + item.severity"></div>
<!-- 如果 item.severity 是 'error'，最終渲染成 class="app-toast-error" -->
```

📌 **本專案範例**（`admin_dashboard.html`）：

```html
<!-- :stats 把 JS 的 stats ref 傳給子元件 -->
<admin-overview-panel :stats="stats" @refresh="refreshDemoData" />

<!-- :loading 、:disabled 動態控制按鈕狀態 -->
<p-button
  :loading="triggerBusy"
  :disabled="triggerBusy"
  @click="triggerAdminAction"
/>

<!-- :checked 把 checkbox 狀態綁到 triggerEnabled -->
<input
  type="checkbox"
  :checked="triggerEnabled"
  :disabled="triggerBusy"
  @change="updateTriggerEnabled($event.target.checked)"
/>
```

#### `:class` 的動態 class 綁定

`:class` 是最常用的動態屬性之一，有幾種寫法：

```html
<!-- 字串拼接 -->
<span :class="'trigger-status-' + triggerStatus"></span>
<!-- 若 triggerStatus = 'error'，結果是 class="trigger-status-error" -->

<!-- 物件語法（符合條件才加這個 class） -->
<div :class="{ active: isActive, disabled: isDisabled }"></div>

<!-- 陣列語法 -->
<div :class="['base-class', extraClass]"></div>
```

📌 **本專案範例**（`admin_dashboard.html`）：

```html
<span class="trigger-status" :class="'trigger-status-' + triggerStatus">
  {{ triggerStatus }}
</span>
<p class="admin-trigger-message" :class="'admin-trigger-message-' + triggerStatus">
  {{ triggerMessage }}
</p>
```

---

## 7. 事件處理：@ 指令

### 概念解說

`@click`、`@change`、`@input` 等是 Vue 綁定 DOM 事件的方式，  
等價於 HTML 原生的 `onclick`、`onchange`、`oninput`。

```html
<!-- 原生 HTML -->
<button onclick="doSomething()">按我</button>

<!-- Vue 寫法 -->
<button @click="doSomething">按我</button>
<!-- 或者直接寫表達式 -->
<button @click="count++">+1</button>
```

### 本專案的事件範例

📌 **呼叫函式**（`stock_alert_settings.html`）：

```html
<!-- 按下時呼叫 addRule()，addRule 是 setup() return 出來的 -->
<p-button @click="addRule" label="Add Rule" />

<!-- Reset 按鈕重新載入設定 -->
<p-button @click="loadConfig" label="Reset" />

<!-- Save 按鈕送出設定 -->
<p-button @click="save" label="Save Settings" />
```

📌 **傳遞事件物件**（`admin_dashboard.html`）：

```html
<!-- $event 是原生 DOM 事件物件，$event.target.checked 是 checkbox 的勾選狀態 -->
<input
  type="checkbox"
  @change="updateTriggerEnabled($event.target.checked)"
/>
```

📌 **子元件 emit 事件**（`admin_dashboard.html`）：

```html
<!-- 監聽子元件 admin-overview-panel 發出的 refresh 事件 -->
<admin-overview-panel @refresh="refreshDemoData" />
```

---

## 8. 生命週期：onMounted 與 nextTick

### 概念解說

Vue 元件從「被建立」到「被銷毀」有一個生命週期，  
你可以在特定時間點掛入你的程式邏輯。

```
建立元件  →  setup() 執行  →  渲染 DOM  →  onMounted  →  (使用中...)  →  onUnmounted
```

### onMounted：DOM 準備好之後才執行

`onMounted` 的回調函式會在**元件的 DOM 真正渲染到畫面上之後**執行。  
這是進行「需要 DOM 才能運作」的操作（例如初始化第三方套件、去後端撈資料）的正確時機。

📌 **本專案範例**（`home-view.js`）：

```js
onMounted(loadConfig);
// 等同於：
// onMounted(() => { loadConfig(); });
```

當 HomeView 的 DOM 真正出現在畫面上後，立即呼叫 `loadConfig` 向後端抓設定資料。

**為什麼不在 setup() 直接呼叫 loadConfig？**  
因為 `setup()` 執行時，DOM 還沒渲染出來。  
如果 `loadConfig` 裡有操作 DOM 的動作（例如建立 Tabulator 表格），  
在 DOM 還不存在時呼叫就會失敗。

### nextTick：等 Vue 更新 DOM 之後再執行

Vue 的 DOM 更新是**非同步**的。  
當你改了一個響應式變數，Vue 不會立即更新 DOM，  
而是在「下一個更新批次」才把所有變更一次更新到畫面。

`nextTick()` 讓你等待這個更新批次完成之後再執行後續邏輯。

📌 **本專案範例**（`home-view.js`）：

```js
const loadConfig = async () => {
  const data = await fetch('/api/config').then(r => r.json());
  rules.value = normalizeRules(data.rules);  // 改了響應式變數

  // 此時 DOM 還沒更新！Tabulator 的資料還是舊的
  await nextTick();
  // 現在 DOM 已經更新，可以安全地操作 Tabulator

  if (table) table.setData(rules.value);
  else buildTable();
};
```

💡 **延伸知識**：你可以把 `nextTick` 想成「等 Vue 結帳」。  
就像超市結帳，你一次買多樣東西，不是買一樣就結一次帳，  
Vue 也是把多個狀態變更「堆在一起」，等一個時間點「一次結算更新到 DOM」。  
`nextTick` 讓你排在這次結算之後執行你的程式。

---

## 9. Props：父元件傳資料給子元件

### 概念解說

元件之間是**樹狀結構**，父元件可以把資料往下傳給子元件。  
這個往下傳的機制叫做 **Props（屬性）**。

原則是單向資料流（One-Way Data Flow）：  
**資料只能從父到子，子元件不能直接修改父元件傳進來的 props。**

### 本專案的 Props 範例

📌 **父元件 `AdminView`** 透過 `:stats` 傳資料給子元件：

```html
<!-- admin_dashboard.html -->
<admin-overview-panel :stats="stats" @refresh="refreshDemoData" />
```

這裡 `:stats="stats"` 的冒號代表「右邊是 JS 表達式（響應式變數 stats）」，  
因此子元件收到的是響應式的資料，父元件的 `stats` 一更新，子元件就能感知到。

📌 **子元件 `AdminOverviewPanel`** 宣告它需要接收什麼 props：

```js
// components/admin-overview-panel.js
export default {
  props: {
    stats: {
      type: Object,    // 限定型別，方便開發時除錯
      required: true,  // 表示這個 prop 是必填的
    },
  },
  // ...
};
```

📌 **子元件 template 使用 props**：

```html
<!-- 子元件的 template 直接使用 stats，就像自己的資料一樣 -->
<strong>{{ stats.activeUsers }}</strong>
<strong>{{ stats.trackedSymbols }}</strong>
<strong>{{ stats.alertsSent }}</strong>
```

### 為什麼要宣告 type 和 required？

這是**防禦性程式設計**。  
當父元件傳錯型別或忘記傳資料時，Vue 會在開發者工具裡顯示警告，  
幫助你快速發現「是哪個父元件傳錯了」。

---

## 10. Emits：子元件通知父元件

### 概念解說

資料從父流向子，那子元件要怎麼「回報」什麼事情給父元件呢？  
答案是透過 **Emits（事件）**。

子元件發出一個事件（emit），  
父元件用 `@事件名稱` 監聽，並決定要做什麼反應。

這樣父子元件是**鬆耦合**的：子元件不需要知道父元件會怎麼反應，  
它只負責「喊一聲」，父元件自己決定要做什麼。

### 本專案的 Emits 範例

📌 **子元件 `AdminOverviewPanel`** 宣告可能發出的事件，並在按鈕上發出：

```js
// components/admin-overview-panel.js
export default {
  emits: ['refresh'],  // 宣告這個元件可能發出 refresh 事件

  template: `
    <!-- $emit('refresh') 發出事件，不帶任何資料 -->
    <p-button @click="$emit('refresh')" label="Refresh Demo Data" />
  `,
};
```

📌 **父元件 `AdminView`** 監聽並回應：

```html
<!-- admin_dashboard.html -->
<!-- 當子元件 emit 'refresh'，父元件執行 refreshDemoData() -->
<admin-overview-panel :stats="stats" @refresh="refreshDemoData" />
```

### 整個 Props + Emits 的資料流

```
AdminView (父)
  ├── 傳出 :stats="stats"          →  AdminOverviewPanel (子) 收到 props.stats
  └── 監聽 @refresh="refreshDemoData"  ←  AdminOverviewPanel 按鈕按下時 $emit('refresh')
```

### Emit 也可以傳資料

子元件發出事件時，可以附帶資料：

```js
// 子元件
$emit('select', { id: 1, name: 'Apple' });

// 父元件接收
// @select="handleSelect"

// handleSelect 函式
const handleSelect = (payload) => {
  console.log(payload.id);    // 1
  console.log(payload.name);  // Apple
};
```

本專案的 `refresh` 事件不需要帶資料，所以直接 `$emit('refresh')` 即可。

---

## 11. Vue Router：前端頁面切換

### 概念解說

Router（路由器）解決的問題是：**在不重新整理頁面的情況下，切換顯示不同的畫面。**  
這種做法叫做 **SPA（Single Page Application，單頁應用程式）**。

網址改變時，瀏覽器不發新的 HTTP 請求，而是由 Vue Router 攔截，  
根據網址換上對應的 Vue 元件。

### Hash 模式 vs History 模式

本專案使用 **Hash 模式**：網址長得像 `http://localhost/#/admin`。

```js
const { createWebHashHistory } = VueRouter;
const router = createRouter({
  history: createWebHashHistory(),  // hash 模式
  routes,
});
```

**為什麼選 Hash 模式？**  
Hash（`#` 之後的部分）的變化**不會讓瀏覽器向伺服器發請求**。  
這代表後端不需要做任何設定，前端路由完全由瀏覽器 JS 處理。  
對於部署在 PythonAnywhere 的靜態檔案伺服器，這是最簡單的選擇。

💡 **History 模式**（`createWebHistory()`）的網址看起來更乾淨（`/admin` vs `/#/admin`），  
但後端需要設定「所有路徑都回傳同一個 `index.html`」，稍微複雜一點。

### 路由表（routes）

📌 **`app.js`**：

```js
const routes = [
  { path: '/',       component: HomeView },   // 首頁
  { path: '/admin',  component: AdminView },   // 管理頁

  // 保底規則：輸入不存在的路徑，就轉回首頁
  { path: '/:pathMatch(.*)*', redirect: '/' },
];
```

`/:pathMatch(.*)*` 是正規表達式 catch-all，匹配任何未定義的路徑。

### router-link：不重整頁面的導覽

📌 **`app.js` AppShell template**：

```html
<!-- 不要用 <a href="/admin">，那會整頁重整 -->
<!-- 用 router-link，它只換 router-view 的內容 -->
<router-link to="/" active-class="active" exact-active-class="active">HOME</router-link>
<router-link to="/admin" active-class="active">ADMIN</router-link>
```

- `active-class="active"`：當目前網址符合這個連結時，自動加上 `active` class。
- `exact-active-class="active"`：精確匹配（`/` 只在網址完全是 `/` 時才加 class，避免所有路徑都匹配到 `/`）。

### router-view：頁面渲染的位置

```html
<!-- AppShell template 裡 -->
<router-view />
```

這個標籤是一個**佔位符號**，Vue Router 會根據目前網址，把對應的元件放在這裡。

完整流程：

```
使用者點了 "ADMIN"
  → router-link 修改 URL 為 /#/admin
  → Vue Router 偵測到 URL 變化
  → 找到對應規則：{ path: '/admin', component: AdminView }
  → 把 AdminView 渲染到 <router-view /> 的位置
  → 畫面更新，但頁面沒有重新整理
```

---

## 12. 全域元件註冊：app.component()

### 概念解說

如果一個元件在很多地方都會用到，可以「全域註冊」它，  
這樣整個 app 的任何 template 都能直接使用，不需要每次都 import。

### 本專案的全域元件

📌 **`app.js`**：

```js
// PrimeVue 提供的 UI 元件，全部手動全域註冊
app.component('p-card',        primevue.card);
app.component('p-button',      primevue.button);
app.component('p-inputnumber', primevue.inputnumber);
app.component('p-tag',         primevue.tag);
```

註冊後，任何 template 裡都可以直接寫：

```html
<p-button label="Save" icon="pi pi-save" severity="success" @click="save" />
<p-tag severity="info" value="GLOBAL" :rounded="true" />
<p-inputnumber v-model="longTermDrop.days" :min="1" />
```

### 為什麼 AdminOverviewPanel 不是全域元件？

📌 **`admin-view.js`**：

```js
export default {
  components: {
    AdminOverviewPanel,  // 只在 AdminView 這裡用到，所以只在這裡局部註冊
  },
  // ...
};
```

**規則**：只在少數地方用到的元件 → 局部（local）註冊；  
整個 app 到處用的 → 全域（global）註冊。

### 元件名稱：PascalCase vs kebab-case

Vue 接受兩種元件名稱格式：

```html
<!-- PascalCase（JS 裡的慣例） -->
<AdminOverviewPanel />

<!-- kebab-case（HTML 裡的慣例，Vue 自動轉換） -->
<admin-overview-panel />
```

兩者在 Vue 裡是等價的。本專案在 HTML template 裡用 `admin-overview-panel`，  
在 JS 裡定義時用 `AdminOverviewPanel`，這是很常見的混用方式。

---

## 13. Options API vs Composition API

本專案同時用了兩種寫法，值得對照了解。

### Options API（選項式）

用一個**大物件**來描述元件，每種功能放在對應的選項（key）裡：

```js
export default {
  props: { /* 接收外部資料 */ },
  emits: ['refresh'],
  data() { return { count: 0 }; },
  methods: {
    increment() { this.count++; }
  },
  mounted() { /* DOM 準備後 */ },
  template: `<button @click="increment">{{ count }}</button>`,
};
```

📌 **本專案使用 Options API 的地方**：`components/admin-overview-panel.js`  
（因為這個元件很單純，只有 props 和 emits，用 Options API 結構更清晰）

### Composition API（組合式）

把邏輯**按功能組合**，而不是按 Vue 規定的類型分類：

```js
import { ref, onMounted } from 'vue';

export default {
  setup() {
    const count = ref(0);
    const increment = () => { count.value++; };
    onMounted(() => { console.log('DOM ready'); });
    return { count, increment };
  }
};
```

📌 **本專案使用 Composition API 的地方**：`home-view.js`、`admin-view.js`

### 選哪個？

| | Options API | Composition API |
|---|---|---|
| 學習曲線 | 較低，結構直觀 | 稍高，但更彈性 |
| 邏輯重用 | 較難 | 容易（組合式函式 Composable） |
| TypeScript 支援 | 普通 | 優秀 |
| 適合場景 | 簡單元件、初學 | 複雜邏輯、大型專案 |

Vue 3 兩種都支援，且可以混用（如本專案）。  
官方建議新專案優先使用 **Composition API**。

---

## 14. 本專案架構全覽

讀到這裡，你應該對本專案的整個運作方式有完整認識了。  
最後用一張完整的資料流圖收尾：

```
index.html
  ├── 載入 CDN：Vue / VueRouter / PrimeVue / Tabulator
  └── <script type="module" src="app.js">
        │
        ├── fetch('stock_alert_settings.html')  ─┐
        ├── fetch('admin_dashboard.html')        ─┤ Promise.all 同時載入
        │                                         ┘
        ├── HomeView.template = homeTemplate   ← 指派 HTML 字串為 template
        ├── AdminView.template = adminTemplate
        │
        ├── createApp(AppShell)
        │     app.use(router)          ← 安裝路由
        │     app.use(PrimeVue config)  ← 安裝 UI 套件
        │     app.component('p-button', ...)  ← 全域元件
        │     app.mount('#app')        ← 掛到 DOM
        │
        └── 畫面開始渲染
              AppShell（外框）
                ├── <nav> 導覽列（router-link）
                └── <router-view>
                      ├── [網址 /#/] → HomeView
                      │     ├── setup() 執行，宣告 rules / longTermDrop / notifications...
                      │     ├── onMounted → loadConfig() → fetch /api/config
                      │     ├── nextTick → buildTable（Tabulator）
                      │     └── template: stock_alert_settings.html
                      │           v-model → longTermDrop.days / drop_percent
                      │           v-for  → notifications（toast 列表）
                      │           @click → addRule / loadConfig / save
                      │
                      └── [網址 /#/admin] → AdminView
                            ├── setup() 執行，宣告 stats / triggerEnabled...
                            ├── components: { AdminOverviewPanel }（局部元件）
                            └── template: admin_dashboard.html
                                  :stats → 傳給子元件（Props）
                                  @refresh → 監聽子元件事件（Emits）
                                  AdminOverviewPanel
                                    └── $emit('refresh') → 父執行 refreshDemoData()
```

---

## 快速查詢表

| 你想做的事 | Vue 語法 | 本專案範例 |
|---|---|---|
| 顯示 JS 變數值 | `{{ variable }}` | `{{ stats.activeUsers }}` |
| 讓輸入框和變數同步 | `v-model` | `v-model="longTermDrop.days"` |
| 重複渲染列表 | `v-for="item in list" :key` | `v-for="item in notifications"` |
| 動態修改 HTML 屬性 | `:attr="expression"` | `:disabled="triggerBusy"` |
| 動態修改 CSS class | `:class` | `:class="'app-toast-' + item.severity"` |
| 監聽點擊事件 | `@click="fn"` | `@click="save"` |
| 監聽其他事件 | `@change / @input` | `@change="updateTriggerEnabled(...)"` |
| 單一值的響應式 | `ref(初始值)` | `const rules = ref([])` |
| 物件的響應式 | `reactive({...})` | `const longTermDrop = reactive({...})` |
| DOM 準備好後執行 | `onMounted(fn)` | `onMounted(loadConfig)` |
| 等 DOM 更新後執行 | `await nextTick()` | `await nextTick(); buildTable()` |
| 父傳資料給子 | Props + `:prop="value"` | `:stats="stats"` |
| 子通知父 | `$emit('event')` + `@event` | `$emit('refresh')` / `@refresh` |
| 前端頁面切換 | `router-link` + `router-view` | `<router-link to="/admin">` |

---

*本手冊以 StockAlert Admin 專案（Vue 3 CDN + Vue Router 4 + PrimeVue）為基礎撰寫。*
