// 這個檔案定義管理頁 view。
// 它是路由層級的元件，會對應到 /#/admin。
import AdminOverviewPanel from '../components/admin-overview-panel.js';

// 這個 view 只需要 ref，因為目前管理頁資料是簡單的響應式値。
const { ref } = Vue;

// AdminView 是管理頁本身。
// 它負責準備資料，並把資料傳給子元件 AdminOverviewPanel 顯示。
export default {
    // 在這裡註冊這個 view 會使用到的子元件。
    components: {
      AdminOverviewPanel,
    },

    // setup() 內定義這個頁面的狀態和行為。
    setup() {
      // stats: 管理頁上方三張統計卡顯示的數字。
      const stats = ref({
        activeUsers: 12,
        trackedSymbols: 34,
        alertsSent: 58,
      });

      // triggerEnabled: 新增的 toggle 狀態。
      // triggerBusy: 按鈕執行中狀態，避免重複觸發。
      // triggerStatus: idle | running | success | error。
      // triggerMessage: 顯示在操作區塊下方的文字。
      const triggerEnabled = ref(false);
      const triggerBusy = ref(false);
      const triggerStatus = ref('idle');
      const triggerMessage = ref('尚未執行手動操作。');

      // refreshDemoData: 示意用的重新整理函式。
      // 目前它不呼叫後端，而是隨機更新畫面上的假資料。
      const refreshDemoData = () => {
        stats.value = {
          activeUsers: 10 + Math.floor(Math.random() * 8),
          trackedSymbols: 28 + Math.floor(Math.random() * 12),
          alertsSent: 40 + Math.floor(Math.random() * 30),
        };
      };

      const updateTriggerEnabled = (value) => {
        triggerEnabled.value = Boolean(value);
      };

      // triggerAdminAction: 第一版先做假串接。
      // 改成真實呼叫後端 API /api/admin/trigger-job。
      const triggerAdminAction = async () => {
        if (triggerBusy.value) {
          return;
        }

        triggerBusy.value = true;
        triggerStatus.value = 'running';
        triggerMessage.value = triggerEnabled.value
          ? 'Manual trigger request sent (mode: enabled)...'
          : 'Manual trigger request sent (mode: safe)...';

        try {
          const response = await fetch('/api/admin/trigger-job', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              force_send_report: triggerEnabled.value,
            }),
          });

          const result = await response.json().catch(() => ({}));
          if (!response.ok) {
            throw new Error(result.message || 'Backend request failed.');
          }

          triggerStatus.value = 'success';
          triggerMessage.value = result.message || 'Backend trigger success.';
        } catch (error) {
          triggerStatus.value = 'error';
          triggerMessage.value = error?.message || 'Unknown demo error.';
        } finally {
          triggerBusy.value = false;
        }
      };

      // 將要給 template 使用的值回傳出去。
      return {
        stats,
        refreshDemoData,
        triggerEnabled,
        triggerBusy,
        triggerStatus,
        triggerMessage,
        updateTriggerEnabled,
        triggerAdminAction,
      };
    },
  };