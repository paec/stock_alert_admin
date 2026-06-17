<template>
  <section class="settings-card">
    <!-- 標題區 -->
    <div class="card-header">
      <div class="card-title">
        <i class="pi pi-cog"></i>
        <span>Administrator Panel (Demo Component)</span>
      </div>
      <p-tag severity="warning" value="DEMO" :rounded="true" />
    </div>

    <p style="color:#64748b;font-size:14px;line-height:1.5;">這是示意用 Vue component，後續可替換成真實管理功能。</p>

    <!-- 三張統計卡：數字來自父元件傳入的 stats -->
    <div class="admin-panel">
      <div class="admin-stat">
        <span>Active Users</span>
        <strong>{{ stats.activeUsers }}</strong>
      </div>
      <div class="admin-stat">
        <span>Tracked Symbols</span>
        <strong>{{ stats.trackedSymbols }}</strong>
      </div>
      <div class="admin-stat">
        <span>Alerts Sent (24h)</span>
        <strong>{{ stats.alertsSent }}</strong>
      </div>
    </div>

    <!-- 按下按鈕時，不直接處理邏輯，而是透過 $emit('refresh') 通知父元件 -->
    <div class="actions-bar" style="margin-top:16px;">
      <p-button label="Refresh Demo Data" icon="pi pi-refresh" severity="secondary" outlined @click="$emit('refresh')" />
    </div>
  </section>
</template>

<script>
export default {
  name: 'AdminOverviewPanel',
  props: {
    stats: {
      type: Object,
      required: true,
    },
  },
  emits: ['refresh'],
};
</script>
