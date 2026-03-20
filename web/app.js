// 使用全域 `Vue`，從中取需要的 Composition API 工具
const { createApp, ref, reactive, onMounted } = Vue;

/*
  Composition API 改寫說明（中文註解）
  - 使用 `setup()` 來建立組件邏輯
  - `ref()` / `reactive()` 用於建立響應式資料
  - `onMounted()` 取代 Options API 的 `mounted()`
  - 在 `setup()` 回傳的變數與函式會暴露給模板使用
*/

createApp({
  setup() {
    // `rules` 用 ref 包裝，模板中直接使用 `rules`（Vue 會自動處理 .value）
    const rules = ref([]);
    const longTermDrop = reactive({
      days: 60,
      drop_percent: 10,
    });

    // 非同步載入設定資料
    const loadConfig = async () => {
      try {
        const res = await fetch('/api/config');
        const data = await res.json();
        // 確保為陣列再指派
        rules.value = Array.isArray(data.rules) ? data.rules : [];

        const apiLongTermDrop = data.long_term_drop;
        if (apiLongTermDrop && typeof apiLongTermDrop === 'object') {
          const days = Number(apiLongTermDrop.days);
          const dropPercent = Number(apiLongTermDrop.drop_percent);

          if (Number.isFinite(days) && days > 0) {
            longTermDrop.days = days;
          }
          if (Number.isFinite(dropPercent) && dropPercent > 0) {
            longTermDrop.drop_percent = dropPercent;
          }
        }
      } catch (err) {
        console.error('Load config failed', err);
      }
    };

    // 在組件已掛載後執行資料載入
    onMounted(loadConfig);

    // 新增一筆空的 rule
    const addRule = () => {
      rules.value.push({ symbol: '', x_days: 3, y_percent: 5 });
    };

    // 儲存到後端（簡單處理，保持原行為）
    const save = async () => {
      try {
        const res = await fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            long_term_drop: {
              days: longTermDrop.days,
              drop_percent: longTermDrop.drop_percent,
            },
            rules: rules.value,
          }),
        });
        if (!res.ok) throw new Error('Save failed');
        alert('Saved');
      } catch (err) {
        console.error(err);
        alert('Save failed');
      }
    };

    // 將要在模板中使用的變數與方法回傳
    return {
      rules,
      longTermDrop,
      addRule,
      save,
    };
  },
}).mount('#app');
