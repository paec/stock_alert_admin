// 這個檔案定義管理頁 view。
// 它是路由層級的元件，會對應到 /#/admin。
(function () {
  // 這個 view 只需要 ref，因為目前管理頁資料是簡單的響應式值。
  const { ref } = Vue;

  // 建立全域命名空間，讓 app.js 能拿到這個 View。
  window.StockAlertAdmin = window.StockAlertAdmin || {};
  window.StockAlertAdmin.views = window.StockAlertAdmin.views || {};
  window.StockAlertAdmin.components = window.StockAlertAdmin.components || {};

  // AdminView 是管理頁本身。
  // 它負責準備資料，並把資料傳給子元件 AdminOverviewPanel 顯示。
  window.StockAlertAdmin.views.AdminView = {
    // 在這裡註冊這個 view 會使用到的子元件。
    components: {
      AdminOverviewPanel: window.StockAlertAdmin.components.AdminOverviewPanel,
    },

    // setup() 內定義這個頁面的狀態和行為。
    setup() {
      // stats: 管理頁上方三張統計卡顯示的數字。
      const stats = ref({
        activeUsers: 12,
        trackedSymbols: 34,
        alertsSent: 58,
      });

      // activities: 下方活動清單的示意資料。
      const activities = ref([
        { time: '09:10', text: 'System health check passed.' },
        { time: '09:22', text: 'Rules snapshot exported (demo).' },
        { time: '10:03', text: 'Operator updated threshold template.' },
        { time: '10:45', text: 'Notification queue drained successfully.' },
      ]);

      // refreshDemoData: 示意用的重新整理函式。
      // 目前它不呼叫後端，而是隨機更新畫面上的假資料。
      const refreshDemoData = () => {
        stats.value = {
          activeUsers: 10 + Math.floor(Math.random() * 8),
          trackedSymbols: 28 + Math.floor(Math.random() * 12),
          alertsSent: 40 + Math.floor(Math.random() * 30),
        };
        activities.value = [
          { time: '11:00', text: 'Demo data refreshed by admin user.' },
          ...activities.value.slice(0, 3),
        ];
      };

      // 將要給 template 使用的值回傳出去。
      return {
        stats,
        activities,
        refreshDemoData,
      };
    },
  };
})();