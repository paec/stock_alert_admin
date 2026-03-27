// 這個檔案定義一個「可重用元件」：AdminOverviewPanel。
// 它不是一整頁，而是管理頁中的一塊內容。

// 這個元件採用 Options API 寫法。
// 你可以把它當成用「物件設定」方式來描述元件需要什麼資料、會發出什麼事件。
export default {
    // props 是父元件傳進來的資料。
    // 這裡要求傳入 stats 物件和 activities 陣列。
    props: {
      stats: {
        type: Object,
        required: true,
      },
      activities: {
        type: Array,
        required: true,
      },
    },

    // emits 表示這個元件可能主動對外發出的事件名稱。
    // 這裡只有 refresh，代表使用者按按鈕時，通知父層「請重新整理資料」。
    emits: ['refresh'],

    // template 是這個元件的畫面內容。
    // 它只專心做畫面顯示，不自己管理資料來源。
    template: `
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

        <!-- 活動清單。
             v-for 會把 activities 陣列的每一筆資料渲染成一列。 -->
        <div class="admin-feed">
          <div class="admin-feed-row" v-for="item in activities" :key="item.time + item.text">
            <time>{{ item.time }}</time>
            <div>{{ item.text }}</div>
          </div>
        </div>
      </section>
    `,
  };