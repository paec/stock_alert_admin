import { createRouter, createWebHashHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import AdminView from '@/views/AdminView.vue';

// routes 陣列就是「網址 -> 畫面元件」的對照表。
// path: 網址路徑
// component: 當網址符合時，要渲染哪個 Vue 元件
//
// '/'      -> 首頁設定畫面
// '/admin' -> 管理頁畫面
// 最後一條是保底規則，若輸入未知路徑，就自動導回首頁。
const routes = [
  { path: '/', component: HomeView },
  { path: '/admin', component: AdminView },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

// 建立 router 實例。
// history 決定網址模式；routes 則提供每條路徑對應的頁面元件。
const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
