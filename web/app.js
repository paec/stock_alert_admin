//  從 Vue 全域物件解構出需要用到的 API 
// createApp      : 建立一個 Vue 應用程式實例
// ref            : 讓「純值」（數字、字串、陣列）變成響應式。讀寫時要用 .value
// reactive       : 讓「物件」整體變成響應式。讀寫直接用屬性名稱，不需要 .value
// onMounted      : 生命週期鉤子，元件的 DOM 真正掛上頁面後才執行，適合初始化 API 呼叫
// nextTick       : 等 Vue 把 DOM 更新完畢後再執行，用在「先改資料、再操作 DOM」的場景
// getCurrentInstance : 取得當前 Vue 元件實例（本檔已不使用，但保留以供未來擴充）
const { createApp, ref, reactive, onMounted, nextTick, getCurrentInstance } = Vue;

//  根元件定義 
// Vue 應用程式只有一個「根元件」，整個畫面都在這裡定義。
// 這裡用「選項物件」方式撰寫（setup 函式 + template 字串），
// 不需要 .vue 檔，適合直接用 CDN 載入的頁面。
const RootComponent = {
  // setup() 是 Vue 3 Composition API 的進入點。
  // 所有響應式狀態（ref/reactive）、函式都在這裡宣告，
  // 最後用 return 把需要在 template 裡存取的東西「暴露」出去。
  setup() {

    //  響應式狀態 

    // rules: Alert Rules 表格的資料陣列。
    //   初始為空，loadConfig() 呼叫後填入後端資料。
    //   用 ref([]) 包裝，在 JS 讀寫時要用 rules.value，
    //   在 template 裡可以直接寫 rules（Vue 自動解包）。
    const rules = ref([]);

    // longTermDrop: 全域長期跌幅設定（一個物件）。
    //   用 reactive 包裝，存取方式是 longTermDrop.days / longTermDrop.drop_percent，
    //   不需要 .value，在 template 裡也是相同寫法。
    const longTermDrop = reactive({ days: 60, drop_percent: 10 });

    // notifications: 右下角 Toast 通知的佇列（陣列）。
    //   每次 showToast 呼叫就推一個物件進來，
    //   時間到或使用者按關閉後再從陣列移除，Vue 會自動重新渲染 toast 區塊。
    const notifications = ref([]);

    // tableEl: 對應 template 裡 <div ref="tableEl"> 的 DOM 節點。
    //   預設 null，等 onMounted 後 Vue 才會把真正的 HTMLElement 填進來。
    //   Tabulator 需要直接拿到 DOM 元素才能初始化，所以用這個方式取得，
    //   比用字串 '#rules-table' 更穩固（Tabulator 不會因 DOM 被移除而崩潰）。
    const tableEl = ref(null);

    // table: Tabulator 實例，存放在普通變數（不是 ref），
    //   因為 Tabulator 物件本身不需要響應式追蹤，
    //   只需要在多個函式之間共用同一個參照。
    let table = null;

    // notificationId: 每個 toast 的唯一 ID 計數器（每次 showToast 遞增 1）。
    //   用來讓 v-for 的 :key 和 removeToast 能精確對應到同一筆通知。
    let notificationId = 0;


    //  Toast 通知工具函式 

    // removeToast(id): 用 filter 把指定 id 的通知從陣列移除。
    //   Vue 偵測到 notifications.value 內容變化後，會自動重新渲染 toast 列表。
    const removeToast = (id) => {
      notifications.value = notifications.value.filter((item) => item.id !== id);
    };

    // showToast(severity, summary, detail, life):
    //   severity : 'success' | 'error'，決定 toast 套用哪個顏色 CSS class
    //   summary  : 粗體標題文字
    //   detail   : 說明文字
    //   life     : 幾毫秒後自動消失（預設 3200ms）
    const showToast = (severity, summary, detail, life = 3200) => {
      const id = ++notificationId;
      // 展開舊陣列並在末尾加入新 toast。
      // 不用 push() 的原因：push 是原地修改同一個陣列，
      // 重新賦值才能確保每次都觸發 Vue 的響應式更新。
      notifications.value = [...notifications.value, { id, severity, summary, detail }];
      window.setTimeout(() => removeToast(id), life);
    };


    //  資料正規化 / 驗證 

    // normalizeRules(rows): 把任何來源的規則資料統一格式化。
    //   - symbol 去除頭尾空白並轉大寫（使用者輸入 "0050 " 也能正確存）
    //   - x_days / y_percent 強制轉成數字
    //     （Tabulator 有時會讓欄位值變成字串型態，Number() 確保型態正確）
    const normalizeRules = (rows) => rows.map((row) => ({
      symbol:    (row.symbol || '').trim().toUpperCase(),
      x_days:    Number(row.x_days),
      y_percent: Number(row.y_percent),
    }));

    // validateRules(rows): 逐筆檢查規則資料是否合法。
    //   遇到第一個不合法的欄位就立即回傳錯誤訊息字串，
    //   若全部都合法則回傳 null。
    //   在 save() 裡呼叫，確保不會把壞資料送給後端（避免後端回 400）。
    const validateRules = (rows) => {
      for (let index = 0; index < rows.length; index += 1) {
        const row = rows[index];
        const rowNumber = index + 1; // 給使用者看的「第幾筆」從 1 開始

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

      // 所有筆都通過驗證
      return null;
    };


    //  Tabulator 表格 
    // Tabulator 是一個和 Vue 完全獨立的純 JS 表格套件。
    // 它直接操作 DOM，不走 Vue 的渲染流程，
    // 因此每次資料有變動（編輯、刪除、新增）都需要手動呼叫 syncFromTable()
    // 把 Tabulator 的「真實資料」同步回 Vue 的 rules.value，讓兩邊保持一致。

    // buildTable(): 初始化 Tabulator 實例。
    //   有兩個防呆條件：
    //   1. table 已存在  跳過，不允許重複建立（避免多個表格疊在一起）
    //   2. tableEl.value 還是 null（DOM 尚未就緒） 跳過
    const buildTable = () => {
      if (table || !tableEl.value) return;
      table = new Tabulator(tableEl.value, {
        data: rules.value,         // 初始資料來自 Vue 的 rules.value
        layout: 'fitColumns',       // 欄寬自動撐滿容器寬度
        height: 'auto',             // 高度依資料行數自動展開（不固定高度）
        placeholder: '<span style="color:#8892a4;font-size:13px;">No rules yet  click Add Rule to start</span>',
        columns: [
          {
            title: 'Symbol', field: 'symbol', // field 對應資料物件的 key 名稱
            editor: 'input',                   // 點擊儲存格後出現文字輸入框
            editorParams: { elementAttributes: { maxlength: 20 } }, // 最多 20 字
            formatter: (cell) => {
              // formatter: 控制儲存格「顯示」的 HTML，不影響實際儲存的資料值
              const v = cell.getValue();
              return v
                ? `<span style="font-weight:600;color:#1a2235;letter-spacing:.5px;">${v.toUpperCase()}</span>`
                : `<span style="color:#9aaabb;font-style:italic;">click to edit</span>`; // 空值時顯示灰色提示
            },
            headerSort: false, minWidth: 160,
          },
          {
            title: 'X Days', field: 'x_days',
            editor: 'number', editorParams: { min: 1, step: 1 }, // 數字輸入，最小值 1，每次加減 1
            formatter: (cell) =>
              `<span style="color:#2563eb;">${cell.getValue()}</span>&nbsp;<span style="color:#556674;font-size:11px;">days</span>`,
            hozAlign: 'center', headerHozAlign: 'center', minWidth: 120,
          },
          {
            title: 'Drop %', field: 'y_percent',
            editor: 'number', editorParams: { min: 0, step: 0.1 }, // 每次加減 0.1%
            formatter: (cell) => {
              const v = Number(cell.getValue()).toFixed(1);
              // 使用標準語意色：紅/橘/綠
              const color = v >= 10 ? '#dc2626' : v >= 5 ? '#d97706' : '#16a34a';
              return `<span style="color:${color};font-weight:600;">${v}%</span>`;
            },
            hozAlign: 'center', headerHozAlign: 'center', minWidth: 120,
          },
          {
            title: '', field: '_del',         // 沒有標題、沒有真實資料，純粹放刪除按鈕
            headerSort: false, hozAlign: 'center', width: 60,
            formatter: () => `<button class="row-delete-btn" title="Delete"><i class="pi pi-trash"></i></button>`,
            // cellClick: 點到這一欄的儲存格時觸發
            // cell.getRow().delete() 讓 Tabulator 移除該列
            // 刪完後呼叫 syncFromTable() 把最新狀態同步回 Vue
            cellClick: (_e, cell) => { cell.getRow().delete(); syncFromTable(); },
          },
        ],
        // cellEdited: 任何儲存格完成編輯後觸發，同步 Tabulator  Vue
        cellEdited: () => syncFromTable(),
      });
    };

    // syncFromTable(): 把 Tabulator 目前所有列的資料讀出來，寫進 Vue 的 rules.value。
    //   必須在每次「刪除列」和「儲存格編輯完成」後呼叫，
    //   確保後續的 save() 驗證和 POST 送出的是最新的資料。
    const syncFromTable = () => {
      if (!table) return;
      rules.value = normalizeRules(table.getData()).map((row) => ({
        symbol: row.symbol,
        // 若天數或跌幅因故為 0 或 NaN，給預設值避免後端驗證失敗
        x_days:    Number.isFinite(row.x_days)   && row.x_days   > 0 ? row.x_days   : 3,
        y_percent: Number.isFinite(row.y_percent) && row.y_percent > 0 ? row.y_percent : 5,
      }));
    };

    // addRule(): 在表格末尾新增一列空白規則，等待使用者手動填入。
    //   優先透過 Tabulator API 新增（table.addRow），確保 DOM 和資料同步；
    //   若 Tabulator 尚未初始化（極罕見的邊緣情況），直接推進 rules.value。
    const addRule = () => {
      const newRow = { symbol: '', x_days: 3, y_percent: 5 };
      if (table) {
        table.addRow(newRow, false); // false = 加到末尾（true 是插入到最前面）
        syncFromTable();
      } else {
        rules.value.push(newRow);
      }
    };

    // loadConfig(): 從後端 GET /api/config 讀取設定，填入 Vue 狀態和 Tabulator。
    //   流程：
    //   1. fetch('/api/config') 取得 JSON
    //   2. 正規化後寫入 rules.value；解析 long_term_drop 寫入 longTermDrop
    //   3. await nextTick()：等 Vue 把資料變更「反映到 DOM」後再繼續
    //      （Tabulator 的 buildTable / setData 需要 DOM 已就緒）
    //   4. 若 table 已存在  setData 更新資料（不重建表格）
    //      若還沒建立  呼叫 buildTable() 初始化
    const loadConfig = async () => {
      try {
        const res  = await fetch('/api/config');
        const data = await res.json();
        rules.value = Array.isArray(data.rules) ? normalizeRules(data.rules) : [];
        const ltd = data.long_term_drop;
        if (ltd && typeof ltd === 'object') {
          const d = Number(ltd.days), p = Number(ltd.drop_percent);
          if (Number.isFinite(d) && d > 0) longTermDrop.days = d;
          if (Number.isFinite(p) && p > 0) longTermDrop.drop_percent = p;
        }
        await nextTick();
        if (table) table.setData(rules.value); // 已建立  只更新資料，不重建表格
        else buildTable();
      } catch (err) {
        console.error('Load config failed', err);
        await nextTick();
        if (table) table.setData([]); // 讀取失敗時清空表格
        else buildTable();
      }
    };

    // save(): 驗證後 POST /api/config 儲存設定。
    //   流程：
    //   1. syncFromTable()  確保 rules.value 是 Tabulator 最新狀態
    //   2. 組裝 payload 並做前端驗證（擋掉空 symbol 等錯誤，不送後端）
    //   3. 通過驗證才送出 POST
    //   4. 依後端回應顯示成功或失敗的 toast
    const save = async () => {
      syncFromTable();

      // 組裝準備送出的 payload（同時再做一次 normalizeRules 確保格式正確）
      const payload = {
        long_term_drop: {
          days:         Number(longTermDrop.days),
          drop_percent: Number(longTermDrop.drop_percent),
        },
        rules: normalizeRules(rules.value),
      };

      // 前端驗證：全域設定
      if (!Number.isFinite(payload.long_term_drop.days) || payload.long_term_drop.days <= 0) {
        showToast('error', '資料錯誤', 'Long-Term Days 必須大於 0');
        return;
      }

      if (!Number.isFinite(payload.long_term_drop.drop_percent) || payload.long_term_drop.drop_percent <= 0) {
        showToast('error', '資料錯誤', 'Drop Threshold 必須大於 0');
        return;
      }

      // 前端驗證：逐筆規則
      const validationError = validateRules(payload.rules);
      if (validationError) {
        showToast('error', '資料錯誤', validationError, 4200);
        return;
      }

      try {
        const res = await fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        // res.json() 解析後端回傳的 JSON。
        // .catch(() => ({})) 表示：若後端沒有回傳 JSON，也不會拋例外，直接給空物件。
        const responseData = await res.json().catch(() => ({}));
        if (!res.ok) {
          // HTTP 狀態碼不是 2xx（如 400 / 500） 拋出錯誤，讓下面的 catch 處理
          throw new Error(responseData.message || 'Save failed');
        }

        showToast('success', '已儲存', '設定已成功儲存');
      } catch (err) {
        console.error(err);
        showToast('error', '儲存失敗', err.message || '設定儲存失敗', 4200);
      }
    };


    //  生命週期 
    // onMounted: 元件的 DOM 掛上頁面後立即執行一次 loadConfig。
    //   等同於「頁面載入完就自動拉一次後端資料」。
    //   （必須等 DOM 就緒，Tabulator 才能找到 tableEl.value 並初始化）
    onMounted(loadConfig);

    // return: 把 template 裡會用到的變數和函式「暴露」給 template。
    //   只有列在這裡的名稱，template 才能存取。
    return { rules, longTermDrop, addRule, loadConfig, save, tableEl, notifications, removeToast };
  },

  //  Template 
  // 用反引號（`...`）包住的 HTML 字串，Vue 會把它編譯成虛擬 DOM。
  //
  // 常用 Vue 模板語法說明：
  //   v-model="x"        : 雙向綁定  畫面輸入改變 x，x 改變也會更新畫面
  //   v-for="item in list" :key="item.id"
  //                      : 迴圈渲染，每個節點需要唯一的 :key 幫助 Vue 追蹤差異，
  //                        避免不必要的重新渲染
  //   :class="expr"      : 動態 class，冒號開頭表示「右邊是 JS 表達式」，不是純字串
  //   @click="fn"        : 監聽點擊事件，等同 v-on:click="fn"
  //   {{ expr }}         : 輸出變數或表達式的值到畫面（單向，純顯示）
  template: `
    <div>

      <!--  頁面標題區  -->
      <div class="page-header">
        <div class="page-header-icon"><i class="pi pi-bell"></i></div>
        <div>
          <h1>Stock Alert Settings</h1>
          <p>Configure drop thresholds and per-symbol alert rules</p>
        </div>
      </div>

      <!--  全域長期跌幅設定卡片  -->
      <section class="settings-card">
        <div class="card-header">
          <div class="card-title">
            <i class="pi pi-sliders-h"></i>
            <span>Global Long-Term Drop</span>
          </div>
          <!-- p-tag 是 PrimeVue 的標籤元件，純粹顯示用 -->
          <p-tag severity="info" value="GLOBAL" :rounded="true" />
        </div>
        <div class="form-grid">
          <div class="form-field">
            <label>Long-Term Days</label>
            <!-- p-inputnumber 是 PrimeVue 的數字輸入元件。
                 v-model 雙向綁定 longTermDrop.days，
                 按 + / - 或直接輸入數字都會同步更新。 -->
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

      <!--  Alert Rules 表格卡片  -->
      <section class="settings-card">
        <div class="card-header">
          <div class="card-title">
            <i class="pi pi-list"></i>
            <span>Alert Rules</span>
          </div>
          <!-- rules.length 是響應式值，rules 陣列長度變動時自動更新 -->
          <p-tag :value="rules.length + ' RULES'" severity="secondary" :rounded="true" />
        </div>
        <!-- ref="tableEl": 讓 Vue 把這個 DOM 節點的參照填入 setup() 裡的 tableEl.value -->
        <div ref="tableEl" id="rules-table"></div>
        <div class="actions-bar">
          <p-button label="Add Rule" icon="pi pi-plus" severity="secondary" outlined size="small" @click="addRule" />
        </div>
      </section>

      <!--  底部動作列  -->
      <div class="save-bar">
        <!-- Reset: 重新向後端拉一次資料，覆蓋目前未儲存的變更 -->
        <p-button label="Reset" icon="pi pi-refresh" severity="secondary" outlined @click="loadConfig" />
        <p-button label="Save Settings" icon="pi pi-save" severity="success" @click="save" />
      </div>

      <!--  Toast 通知堆疊區（右下角固定定位）  -->
      <!-- v-for 迴圈渲染 notifications 陣列，每筆顯示一個 toast 卡片 -->
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
          <!-- 點  手動關閉 toast -->
          <button class="app-toast-close" @click="removeToast(item.id)">
            <i class="pi pi-times"></i>
          </button>
        </div>
      </div>

    </div>
  `,
};


//  建立並啟動 Vue 應用程式 

const app = createApp(RootComponent);

// 安裝 PrimeVue 插件（啟用 ripple 按鈕波紋效果）
app.use(primevue.config.default, { ripple: true });

// 全域註冊 PrimeVue 元件，讓 template 裡可以直接用 <p-button> 等標籤。
// 鍵是 template 裡的標籤名稱，值是對應的元件物件。
app.component('p-card',        primevue.card);
app.component('p-button',      primevue.button);
app.component('p-inputnumber', primevue.inputnumber);
app.component('p-tag',         primevue.tag);

// 把 Vue 應用程式掛載到 index.html 裡 id="app" 的 <div> 上，
// 從這個節點開始，Vue 接管所有的 DOM 渲染。
app.mount('#app');
