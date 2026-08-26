<template>
  <div>
    <!-- 首頁的頁面標題區。
         這裡純粹是靜態畫面說明，沒有特別的 Vue 邏輯。 -->
    <div class="page-header">
      <div class="page-header-icon"><i class="pi pi-bell"></i></div>
      <div>
        <h1>Stock Alert Settings</h1>
        <p>Configure drop thresholds and per-symbol alert rules</p>
      </div>
    </div>

    <!-- 全域長期跌幅設定卡片。
         section 是語意化標籤，表示這是一個獨立區塊。 -->
    <section class="settings-card">
      <div class="card-header">
        <div class="card-title">
          <i class="pi pi-sliders-h"></i>
          <span>Global Long-Term Drop</span>
        </div>
        <!-- p-tag 是 PrimeVue 的標籤元件，這裡只拿來顯示 GLOBAL 標記 -->
        <p-tag severity="info" value="GLOBAL" :rounded="true" />
      </div>

      <!-- form-grid 把下面兩個欄位排成左右兩欄 -->
      <div class="form-grid">
        <div class="form-field">
          <label>Long-Term Days</label>
          <!-- v-model 代表雙向綁定。
               使用者修改輸入框時，longTermDrop.days 會跟著改；
               程式改 longTermDrop.days 時，畫面也會更新。 -->
          <p-inputnumber
            v-model="longTermDrop.days"
            :min="1" :use-grouping="false"
            show-buttons button-layout="stacked"
            increment-button-icon="pi pi-chevron-up"
            decrement-button-icon="pi pi-chevron-down"
          />
        </div>
        <div class="form-field">
          <label>Drop Threshold</label>
          <!-- suffix="%" 會在輸入框後面顯示百分比符號 -->
          <p-inputnumber
            v-model="longTermDrop.drop_percent"
            :min="0" :step="1" :max-fraction-digits="1"
            :use-grouping="false" suffix="%"
            show-buttons button-layout="stacked"
            increment-button-icon="pi pi-chevron-up"
            decrement-button-icon="pi pi-chevron-down"
          />
        </div>
      </div>
    </section>

    <!-- 規則表格區塊。這裡的真實表格不是 Vue 自己畫的，
         而是由 Tabulator 套件掛進下面那個 div。 -->
    <section class="settings-card">
      <div class="card-header">
        <div class="card-title">
          <i class="pi pi-list"></i>
          <span>Alert Rules</span>
        </div>
        <!-- rules.length 是響應式值。
             當規則筆數增減時，這裡顯示的數字會自動更新。 -->
        <p-tag :value="rules.length + ' RULES'" severity="secondary" :rounded="true" />
      </div>
  
  <!-- 這個 div 是 Tabulator 的掛載點。
       一開始它是空的，等 setup 拿到這個 DOM 元素後，
       才會在這裡建立可編輯表格。 -->
      <div ref="tableEl" id="rules-table"></div>

      <!-- Add Rule 按鈕：按下後呼叫 setup() 裡 return 出來的 addRule 函式 -->
      <div class="actions-bar">
        <p-button label="Add Rule" icon="pi pi-plus" severity="secondary" outlined size="small" @click="addRule" />
      </div>
    </section>

    <!-- 底部動作列。
         Reset 重新向後端讀資料；Save Settings 則把目前資料送回後端。 -->
    <div class="save-bar">
      <p-button label="Reset" icon="pi pi-refresh" severity="secondary" outlined @click="loadConfig" />
      <p-button label="Save Settings" icon="pi pi-save" severity="success" @click="save" />
    </div>

    <!-- Toast 通知區。
         v-for 會把 notifications 陣列中的每一筆訊息都渲染成一張通知卡。 -->
    <div class="toast-stack">
      <div
        v-for="item in notifications"
        :key="item.id"
        class="app-toast"
        :class="'app-toast-' + item.severity"
      >
        <div class="app-toast-copy">
          <strong>{{ item.summary }}</strong>
          <span>{{ item.detail }}</span>
        </div>

        <!-- 按下關閉按鈕時，把這筆通知從陣列中移除 -->
        <button class="app-toast-close" @click="removeToast(item.id)">
          <i class="pi pi-times"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, nextTick } from 'vue';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import { getConfig, saveConfig } from '@/services/configService';

export default {
  name: 'HomeView',
  setup() {
    // ===== 響應式資料 =====

    // rules: 首頁表格中的規則資料陣列。
    // 因為是 ref，所以在 JS 中存取要寫 rules.value。
    const rules = ref([]);

    // longTermDrop: 全域長期跌幅設定。
    // 這裡用 reactive，因為它本身是物件，裡面有多個欄位。
    const longTermDrop = reactive({ days: 60, drop_percent: 10 });

    // notifications: 畫面右下角 toast 訊息陣列。
    const notifications = ref([]);

    // tableEl: 對應 template 裡 ref="tableEl" 的 DOM 節點。
    // 等畫面真正渲染完後，Vue 會把實際的 div 元素塞進來。
    const tableEl = ref(null);

    // table: Tabulator 實例。
    // 不需要做成響應式，普通變數即可。
    let table = null;

    // notificationId: 用來幫每一個 toast 產生唯一 id。
    let notificationId = 0;

    // ===== Toast 相關工具函式 =====

    // removeToast(id): 移除指定 id 的通知。
    const removeToast = (id) => {
      notifications.value = notifications.value.filter((item) => item.id !== id);
    };

    // showToast(...): 新增一則通知，並在 life 毫秒後自動移除。
    // severity 會影響畫面上的顏色，例如 success / error。
    const showToast = (severity, summary, detail, life = 3200) => {
      const id = ++notificationId;
      notifications.value = [...notifications.value, { id, severity, summary, detail }];
      window.setTimeout(() => removeToast(id), life);
    };

    // ===== 資料整理與驗證 =====

    // normalizeRules: 把任意來源的規則資料轉成系統內部一致的格式。
    // 例如 symbol 轉大寫、數字欄位強制轉 Number。
    const normalizeRules = (rows) => rows.map((row) => ({
      symbol: (row.symbol || '').trim().toUpperCase(),
      x_days: Number(row.x_days),
      y_percent: Number(row.y_percent),
    }));

    // validateRules: 逐筆檢查規則是否合法。
    // 若發現錯誤，回傳錯誤訊息字串；若全部合法，回傳 null。
    const validateRules = (rows) => {
      for (let index = 0; index < rows.length; index += 1) {
        const row = rows[index];
        const rowNumber = index + 1;

        if (!row.symbol) {
          return `第 ${rowNumber} 筆規則的股票代號不可空白`;
        }

        if (!Number.isFinite(row.x_days) || row.x_days <= 0) {
          return `第 ${rowNumber} 筆規則的天數必須大於 0`;
        }

        if (!Number.isFinite(row.y_percent) || row.y_percent <= 0) {
          return `第 ${rowNumber} 筆規則的跌幅必須大於 0`;
        }
      }

      return null;
    };

    // syncFromTable: 把 Tabulator 內部的資料同步回 Vue 的 rules。
    // 因為 Tabulator 是直接操作 DOM 的第三方套件，
    // 它的資料變化不會自動讓 Vue 知道，所以要手動同步。
    const syncFromTable = () => {
      if (!table) return;
      rules.value = normalizeRules(table.getData()).map((row) => ({
        symbol: row.symbol,
        x_days: Number.isFinite(row.x_days) && row.x_days > 0 ? row.x_days : 3,
        y_percent: Number.isFinite(row.y_percent) && row.y_percent > 0 ? row.y_percent : 5,
      }));
    };

    // buildTable: 建立 Tabulator 表格實例。
    // 只會在 table 還沒建立，而且 tableEl 已經拿到 DOM 時執行。
    const buildTable = () => {
      if (table || !tableEl.value) return;

      // new Tabulator(...) 會直接在指定 DOM 裡建立互動式表格。
      table = new Tabulator(tableEl.value, {
        // 表格初始資料來自 rules.value
        data: rules.value,

        // fitColumns: 欄位會自動分配寬度來填滿整個表格
        layout: 'fitColumns',

        // auto: 高度隨資料筆數自動展開
        height: 'auto',

        // 沒資料時顯示的提示文字
        placeholder: '<span style="color:#8892a4;font-size:13px;">No rules yet  click Add Rule to start</span>',

        // columns 決定每一欄怎麼顯示、是否可編輯、如何格式化
        columns: [
          {
            // 股票代號欄位
            title: 'Symbol', field: 'symbol',
            editor: 'input',
            editorParams: { elementAttributes: { maxlength: 20 } },
            formatter: (cell) => {
              // formatter 只影響畫面顯示，不改真正資料內容
              const value = cell.getValue();
              return value
                ? `<span style="font-weight:600;color:#1a2235;letter-spacing:.5px;">${value.toUpperCase()}</span>`
                : '<span style="color:#9aaabb;font-style:italic;">click to edit</span>';
            },
            headerSort: false, minWidth: 160,
          },
          {
            // 天數欄位
            title: 'X Days', field: 'x_days',
            editor: 'number', editorParams: { min: 1, step: 1 },
            formatter: (cell) => `<span style="color:#2563eb;">${cell.getValue()}</span>&nbsp;<span style="color:#556674;font-size:11px;">days</span>`,
            hozAlign: 'center', headerHozAlign: 'center', minWidth: 120,
          },
          {
            // 跌幅百分比欄位
            title: 'Drop %', field: 'y_percent',
            editor: 'number', editorParams: { min: 0, step: 0.1 },
            formatter: (cell) => {
              const value = Number(cell.getValue()).toFixed(1);

              // 依據數值大小顯示不同顏色，讓重要程度一眼可辨識
              const color = value >= 10 ? '#dc2626' : value >= 5 ? '#d97706' : '#16a34a';
              return `<span style="color:${color};font-weight:600;">${value}%</span>`;
            },
            hozAlign: 'center', headerHozAlign: 'center', minWidth: 120,
          },
          {
            // 刪除按鈕欄位
            title: '', field: '_del',
            headerSort: false, hozAlign: 'center', width: 60,
            formatter: () => '<button class="row-delete-btn" title="Delete"><i class="pi pi-trash"></i></button>',

            // 點刪除按鈕時，刪掉該列並同步回 Vue 狀態
            cellClick: (_event, cell) => { cell.getRow().delete(); syncFromTable(); },
          },
        ],

      });

      table.on('cellEdited', syncFromTable);
    };

    // addRule: 新增一筆預設規則。
    // 若 Tabulator 已初始化，就透過 Tabulator API 加進表格；
    // 否則先加到 Vue 陣列中。
    const addRule = () => {
      const newRow = { symbol: '', x_days: 3, y_percent: 5 };
      if (table) {
        table.addRow(newRow, false);
        syncFromTable();
      } else {
        rules.value.push(newRow);
      }
    };

    // loadConfig: 從後端讀取目前設定。
    // 流程是：fetch -> 轉 JSON -> 寫入 Vue 狀態 -> 等 DOM 更新 -> 同步到 Tabulator。
    const loadConfig = async () => {
      try {
        const data = await getConfig();
        rules.value = Array.isArray(data.rules) ? normalizeRules(data.rules) : [];

        const ltd = data.long_term_drop;
        if (ltd && typeof ltd === 'object') {
          const days = Number(ltd.days);
          const percent = Number(ltd.drop_percent);

          // 先檢查數值合法，再寫回響應式狀態
          if (Number.isFinite(days) && days > 0) longTermDrop.days = days;
          if (Number.isFinite(percent) && percent > 0) longTermDrop.drop_percent = percent;
        }

        // 等待 Vue 把資料變更反映到畫面，再處理表格
        await nextTick();

        // 表格若已存在就更新資料，否則建立表格
        if (table) table.setData(rules.value);
        else buildTable();
      } catch (error) {
        // 讀取失敗時仍然嘗試建立空表格，避免頁面整塊消失
        console.error('Load config failed', error);
        await nextTick();
        if (table) table.setData([]);
        else buildTable();
      }
    };

    // save: 把目前頁面上的設定送回後端儲存。
    // 流程：先同步表格 -> 組 payload -> 前端驗證 -> POST 到 /api/config。
    const save = async () => {
      syncFromTable();

      // payload 是要送給後端的資料格式
      const payload = {
        long_term_drop: {
          days: Number(longTermDrop.days),
          drop_percent: Number(longTermDrop.drop_percent),
        },
        rules: normalizeRules(rules.value),
      };

      // 先做前端驗證，減少送出不合法資料的機會
      if (!Number.isFinite(payload.long_term_drop.days) || payload.long_term_drop.days <= 0) {
        showToast('error', '資料錯誤', 'Long-Term Days 必須大於 0');
        return;
      }

      if (!Number.isFinite(payload.long_term_drop.drop_percent) || payload.long_term_drop.drop_percent <= 0) {
        showToast('error', '資料錯誤', 'Drop Threshold 必須大於 0');
        return;
      }

      const validationError = validateRules(payload.rules);
      if (validationError) {
        showToast('error', '資料錯誤', validationError, 4200);
        return;
      }

      try {
        await saveConfig(payload);
        showToast('success', '已儲存', '設定已成功儲存');
      } catch (error) {
        console.error(error);
        showToast('error', '儲存失敗', error.message || '設定儲存失敗', 4200);
      }
    };

    // onMounted: 畫面掛上頁面後立刻去後端抓設定。
    onMounted(loadConfig);

    // return 裡列出的名稱，template 才能使用。
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
</script>
