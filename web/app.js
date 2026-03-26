// 從 Vue 全域物件中取出 createApp。
// createApp 的工作是「建立整個 Vue 應用程式」。
// 你可以把它理解成：把所有頁面、路由、元件組裝起來，最後掛到畫面上。
const { createApp } = Vue;

// 從 Vue Router 全域物件中取出建立路由需要的 API。
// createRouter          : 建立路由器實例，管理網址和頁面元件的對應關係。
// createWebHashHistory : 使用 hash 模式的網址，例如 /#/admin。
// 這種模式的好處是：不需要後端額外處理前端路由，對目前這種純前端頁面最方便。
const { createRouter, createWebHashHistory } = VueRouter;

// 建立一個全域命名空間，避免不同檔案之間的變數互相汙染。
// 因為這個專案目前不是用 Vite / Webpack / ES Module，而是用多個 <script> 直接載入，
// 所以各檔案需要靠 window 上的共用物件彼此溝通。
window.StockAlertAdmin = window.StockAlertAdmin || {};
window.StockAlertAdmin.views = window.StockAlertAdmin.views || {};

// routes 陣列就是「網址 -> 畫面元件」的對照表。
// path: 網址路徑
// component: 當網址符合時，要渲染哪個 Vue 元件
//
// '/'      -> 首頁設定畫面
// '/admin' -> 管理頁畫面
// 最後一條是保底規則，若輸入未知路徑，就自動導回首頁。
const routes = [
  { path: '/', component: window.StockAlertAdmin.views.HomeView },
  { path: '/admin', component: window.StockAlertAdmin.views.AdminView },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

// 建立 router 實例。
// history 決定網址模式；routes 則提供每條路徑對應的頁面元件。
const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

// AppShell 是整個 SPA 的「外框」元件。
// 它只做兩件事：
// 1. 顯示共用導覽列 navbar
// 2. 顯示目前路由對應的頁面 <router-view />
//
// 可以把它想成每頁共用的外層版型(layout)。
const AppShell = {
  template: `
    <div>
      <!-- 這裡是全站共用的導覽列 -->
      <nav class="app-nav">
        <div class="app-nav-brand">StockAlert Admin</div>
        <div class="app-nav-links">
          <!-- router-link 是 Vue Router 提供的導覽元件。
               和一般 <a> 不同，它切換頁面時不會整頁重新整理。 -->
          <router-link to="/" class="app-nav-link" active-class="active" exact-active-class="active">HOME</router-link>
          <router-link to="/admin" class="app-nav-link" active-class="active">ADMIN</router-link>
        </div>
      </nav>

      <!-- router-view 是路由內容的插槽。
           目前網址是 /#/ 就顯示 HomeView；
           目前網址是 /#/admin 就顯示 AdminView。 -->
      <router-view />
    </div>
  `,
};

// 這裡用一個立即執行的 async 函式來做啟動流程。
// 原因是：我們需要先把外部 HTML template 抓回來，再啟動 Vue。
(async () => {
  try {
    // 同時載入兩份 template：首頁與管理頁。
    // Promise.all 代表兩個請求平行進行，比一個一個 fetch 更有效率。
    const [homeTemplate, adminTemplate] = await Promise.all([
      fetch('./stock_alert_settings.html').then((response) => response.text()),
      fetch('./admin_dashboard.html').then((response) => response.text()),
    ]);

    // 將讀回來的 HTML 字串指定給對應的 View。
    // 這樣每個 View 的 JS 和 HTML 可以拆開放，方便閱讀與維護。
    window.StockAlertAdmin.views.HomeView.template = homeTemplate;
    window.StockAlertAdmin.views.AdminView.template = adminTemplate;

    // 建立 Vue 應用程式，根元件是 AppShell。
    const app = createApp(AppShell);

    // 安裝 Vue Router，讓整個 app 知道路由規則。
    app.use(router);

    // 安裝 PrimeVue 的設定。
    // ripple: true 表示啟用按鈕點擊時的水波紋效果。
    app.use(primevue.config.default, { ripple: true });

    // 因為目前不是 .vue 單檔元件 + 自動匯入環境，
    // 所以要手動把會用到的 PrimeVue 元件註冊到全域。
    // 註冊後，template 裡才能直接寫 <p-button>、<p-tag> 等標籤。
    app.component('p-card', primevue.card);
    app.component('p-button', primevue.button);
    app.component('p-inputnumber', primevue.inputnumber);
    app.component('p-tag', primevue.tag);

    // 最後把 Vue app 掛到 index.html 裡 id="app" 的 div。
    app.mount('#app');
  } catch (error) {
    // 若 template 載入失敗，至少在 console 留下錯誤訊息方便除錯。
    console.error('Failed to initialize SPA templates', error);
  }
})();