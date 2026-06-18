import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  // plugins: 載入 Vite 插件。這裡使用了官方的 Vue 插件，讓 Vite 能夠編譯與處理 Vue 3 的單檔元件 (.vue 檔案)。
  plugins: [vue()],
  resolve: {
    // alias: 路徑別名設定。將 '@' 符號映射到 'web/src/' 目錄，方便在程式碼中以 '@/components/...' 的簡潔方式引入模組，避免相對路徑的層級過深。
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  /* 
    ===================================================================================================
    【開發伺服器設定 (Development Server Settings)】
    此區塊的設定「僅在開發模式下 (npm run dev)」生效。在生產環境下 (npm run build 輸出靜態資源) 並不會運行此伺服器。
    ===================================================================================================
  */
  server: {
    // port: 指定 Vite 開發伺服器運行的通訊埠 (Port)。開發時在瀏覽器輸入 `http://localhost:5173` 即可開啟前端頁面。
    port: 5173,
    // proxy: 跨網域代理設定。解決「開發環境下」前後端分離部署造成的同源政策限制 (CORS 問題)。
    //
    // 💡 為什麼需要代理？
    //    - 在「開發環境」中，前端（Vite 開發伺服器）運行在 `http://localhost:5173`，而 Flask 後端 API 運行在 `http://127.0.0.1:5000`。
    //    - 由於通訊埠 (Port) 不同，瀏覽器出於同源政策 (Same-Origin Policy) 限制，會阻擋前端直接向後端發送非同源請求。
    //    - 透過此代理配置，當前端發送以 `/api` 開頭的請求 (例如 `/api/config`) 時，Vite 開發伺服器會攔截該請求，
    //      並在後台將其轉發 (proxy) 給 `http://127.0.0.1:5000` 處理，然後將結果回傳給瀏覽器。
    //    - 對瀏覽器而言，請求好像是發送給同一個來源 (`http://localhost:5173/api/config`)，從而完美避開了跨網域 (CORS) 限制。
    //
    // 💡 正式生產環境 (Production Mode) 如何運作？
    //    - 在生產環境下，我們執行 `npm run build`，Vite 會將前端代碼打包成純靜態檔案並放入 `dist` 目錄中。
    //    - Flask 後端伺服器 (如 app.py 所示) 會優先偵測並直接將 `web/dist/` 作為靜態資料夾，將網頁靜態資源與 API 接口
    //      全部整合在同一個通訊埠下服務 (例如生產環境的 5000 埠，或是 Nginx 反向代理後的相同 Origin)。
    //    - 因為前端網頁與 API 接口在正式環境中屬於同一個主機與通訊埠 (同源)，因此「不需要」任何代理，
    //      瀏覽器直接請求 `/api/...` 就會由 Flask 後端直接處理，無跨網域問題。
    proxy: {
      '/api': {
        // target: 設定代理的目標後端伺服器網址 (Flask API 運行的位置)
        target: 'http://127.0.0.1:5000',
        // changeOrigin: 設為 true 時，Vite 會自動將請求標頭中的 Host 修改為 target 網址，以欺騙某些對 Host 有嚴格驗證的後端
        changeOrigin: true
      }
    }
  },
  /* 
    ===================================================================================================
    【生產環境建置設定 (Production Build Settings)】
    此區塊設定「僅在打包建置時 (npm run build)」生效。
    ===================================================================================================
  */
  build: {
    // outDir: 指定打包後的輸出目錄。這裡設為 'dist' (即 web/dist/ 檔案夾)。
    //         打包完成後，此檔案夾內會包含經過壓縮、最佳化後的 index.html、JS、CSS 以及其他靜態資產。
    outDir: 'dist',
    // emptyOutDir: 每次建置打包前，是否先清空輸出目錄 (dist)。
    //              設為 true 可確保舊的、不再使用的過期檔案 (例如舊版雜湊檔名的 JS 檔案) 會被完全清除，避免累積垃圾檔案。
    emptyOutDir: true
  }
});
