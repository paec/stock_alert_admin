<template>
  <div>
    <!-- 管理頁的頁首說明區 -->
    <div class="page-header">
      <div class="page-header-icon"><i class="pi pi-shield"></i></div>
      <div>
        <h1>Administrator</h1>
        <p>管理者頁面示意版，後續可放使用者管理與權限控管。</p>
      </div>
    </div>

    <!-- 這裡使用自訂元件 admin-overview-panel。
         冒號 : 開頭代表右邊是 JavaScript 表達式，不是純字串。
         @refresh 代表監聽這個子元件送出的 refresh 事件。 -->
    <admin-overview-panel
      :stats="stats"
      @refresh="refreshDemoData"
    />

    <section class="settings-card admin-trigger-panel">
      <div class="card-header" style="margin-bottom: 14px;">
        <div class="card-title">
          <i class="pi pi-bolt"></i>
          <span>Manual Trigger Panel</span>
        </div>
        <span class="trigger-status" :class="'trigger-status-' + triggerStatus">
          {{ triggerStatus }}
        </span>
      </div>

      <div class="admin-trigger">
        <p class="admin-trigger-desc">切換後，會觸發一次強制Line message發送 (force_send_report)。</p>

        <label class="toggle-row" for="manual-toggle">
          <span>Enable Force Send</span>
          <input
            id="manual-toggle"
            type="checkbox"
            :checked="triggerEnabled"
            :disabled="triggerBusy"
            @change="updateTriggerEnabled($event.target.checked)"
          />
        </label>

        <div class="actions-bar">
          <p-button
            label="Trigger"
            icon="pi pi-play"
            severity="primary"
            :loading="triggerBusy"
            :disabled="triggerBusy"
            @click="triggerAdminAction"
          />
        </div>

        <p class="admin-trigger-message" :class="'admin-trigger-message-' + triggerStatus">{{ triggerMessage }}</p>
      </div>
    </section>
  </div>
</template>

<script>
import { ref } from 'vue';
import AdminOverviewPanel from '@/components/AdminOverviewPanel.vue';
import { triggerJob } from '@/services/adminService';

export default {
  name: 'AdminView',
  components: {
    AdminOverviewPanel,
  },
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

    // triggerAdminAction: 真實呼叫後端 API /api/admin/trigger-job。
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
        const result = await triggerJob(triggerEnabled.value);
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
</script>
