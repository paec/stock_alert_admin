# 前端開發指引

本專案前端為 Vue 3 + Vite，由 Flask 後端一起提供服務。

## 專案結構

```
web/
├── src/
│   ├── main.js              # App 進入點
│   ├── App.vue              # Root component
│   ├── router/index.js      # 路由設定
│   ├── views/               # 頁面元件（HomeView、AdminView）
│   ├── components/          # 共用元件
│   ├── services/            # API 呼叫層（configService、adminService）
│   └── assets/styles.css    # 全域樣式
├── dist/                    # build 輸出（自動產生，不需手動編輯）
├── index.html
├── package.json
└── vite.config.js

backend/
└── app.py                   # Flask，優先服務 web/dist/
```

---

## 一、首次安裝（從零開始）

```bash
# 1. 安裝 Python 依賴
pip install -r requirements.txt

# 2. 初始化資料庫
python backend/init_db.py

# 3. 安裝前端依賴
cd web
npm ci
```

---

## 二、本地開發

**開兩個終端機：**

```bash
# 終端機 1：啟動 Flask 後端（http://127.0.0.1:5000）
python backend/app.py

# 終端機 2：啟動 Vite 開發伺服器（http://localhost:5173，有 hot reload）
cd web
npm run dev
```

> Vite dev server 會自動把 `/api/*` 請求代理到 Flask。
> 開發時只需開 `http://localhost:5173`。

---

## 三、上線前 Build

```bash
cd web
npm run build
```

build 完成後，`web/dist/` 會產生靜態檔案。Flask 啟動時會自動服務 `web/dist/`。

**部署到 PythonAnywhere：**
1. 本地執行 `npm run build`
2. 把 `web/dist/` 連同程式碼一起 commit 並推上去
3. PythonAnywhere reload 後即生效

---

## 四、注意事項

- 編輯前端只改 `web/src/` 裡的 `.vue` 檔，不要動舊的 `web/*.html`
- API 呼叫統一放在 `web/src/services/` 裡
- build 後頁面沒更新？重新跑 `npm run build` 再重啟 Flask

## 五、疑難排解

| 問題 | 原因 | 解法 |
|------|------|------|
| dev 模式出現 "Cannot GET /" | Flask 未啟動 | 確認 `python backend/app.py` 有在跑 |
| Flask 頁面是舊的 | 未重新 build | 執行 `npm run build` |
| build 警告 chunk 太大 | 正常現象 | 暫時忽略，未來可考慮 code-splitting |
