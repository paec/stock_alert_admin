# PythonAnywhere 部署 SOP

基於實際部署經驗整理。

---

## 前置準備（本地）

1. 確保代碼能在本地跑：
   ```bash
   python local_prepare.py
   ```

  `local_prepare.py` 會安裝 Python 依賴、在 `web/` 執行 `npm ci`、執行 `npm run build`，並確認 `web/dist/index.html` 已產生。

2. 測試可訪問：
  ```bash
  python backend/app.py
  ```

  `http://127.0.0.1:5000/api/config`

3. 將 build 產物提交並推送：
  ```bash
  git add web/dist
  git commit -m "Build frontend"
  git push
  ```

  PythonAnywhere 不需要 Node.js 或 npm；正式環境使用的是已提交的 `web/dist/`。

---

## PythonAnywhere 部署步驟

### 第 1 步：上傳代碼到 PythonAnywhere

**位置**：PythonAnywhere 側邊欄 → **Consoles** → **新增 Bash console**（或如果已有直接點 Bash）

在 Bash console 執行：

```bash
cd ~
git clone https://github.com/<your-github>/StockAlertAdmin.git
cd StockAlertAdmin
```

`cd` 後的資料夾名稱以實際 clone 結果為準，不一定是 `stock_alert_admin`。後續 WSGI 路徑與指令都必須使用同一個實際資料夾名稱。

確認目錄結構：
```bash
ls -la
# 應該看到: backend/ web/ pythonanywhere_prepare.py ...
```

記住你的帳戶名（在 Bash 提示符前面，例如 `paec55612@PAS12~$`）

---

### 第 2 步：執行部署準備腳本

**位置**：同一個 **Bash console** 中繼續輸入

```bash
python pythonanywhere_prepare.py
```

這會自動：
- ✅ 升級 pip
- ✅ 安裝 Flask、requests
- ✅ 初始化 SQLite DB（`backend/config.db`）
- ✅ 確認本地 build 的 `web/dist/index.html` 已隨 repository 部署

如果看到 `Missing built frontend`，表示 `web/dist/` 沒有被 commit 或沒有成功 pull；請回到本地執行 `npm ci`、`npm run build`，提交並 push 後再執行 `git pull`。

輸出應該是：
```
[STEP] Upgrade pip
[STEP] Install requirements
[STEP] Initialize SQLite database

Setup complete.

Next steps on PythonAnywhere Web tab:
1) Confirm `web/dist/index.html` exists
2) Edit the WSGI configuration file (in Web tab)
...
```

✅ 看到這些訊息就表示成功了

---

### 第 2.5 步：在 PythonAnywhere 設定環境變數

**位置**：側邊欄 → **Web** 分頁 →  WSGI configuration file 並點擊進入編輯

**Add a new variable**：
- **Name**: `GH_TOKEN`
- **Value**: `ghp_xxxxx...` （你的 GitHub Personal Access Token，需要 `actions:read` 和 `actions:write` 權限）

⚠️ 若無 GH_TOKEN，手動觸發工作流程（Manual Trigger Panel）將無法正常運作。

完成後，點 **Save**。

---

### 第 3 步：編輯 PythonAnywhere 預設的 WSGI 檔

**位置**：側邊欄 → **Web** 分頁

1. 頁面開上方會顯示你的 web app（例如 `paec55612.pythonanywhere.com`）
2. 向下滑，找到 **Code** 區塊
3. 在 **WSGI configuration file:** 這一行，會看到一個檔案路徑（例如 `/var/www/paec55612_pythonanywhere_com_wsgi.py`）
4. 點**旁邊的藍色編輯按鈕** ✏️

**編輯器開啟後**，**完全替換**整個檔案內容為：

```python
import sys
import os

# 把 <username> 和 <project-directory> 改成實際值，Linux 路徑大小寫敏感
sys.path.insert(0, '/home/<username>/<project-directory>')
sys.path.insert(0, '/home/<username>/<project-directory>/backend')

from app import app as application

os.environ.setdefault("STOCKALERT_DEBUG", "false")
```

⚠️ **重要**：
- 把 `<username>` 改成你的實際帳戶名（例如 `paec55612`）
- `<project-directory>` 必須是 PythonAnywhere 上實際存在的專案資料夾名稱

完成後，點 **Save** 按鈕（編輯器右下角或上方）

---

### 第 4 步：Reload Web App

**位置**：仍在 **Web** 分頁

1. 向上滑到頁面頂部
2. 找到大藍色的 **Reload <username>.pythonanywhere.com** 按鈕
3. 點它

等待 5-10 秒，Reload 按鈕旁邊應該出現綠色勾勾 ✔️（表示運行中）

如果出現紅色 X，往下看「常見問題排查」

### 第 5 步：驗證部署

#### 檢查 Error Log

**位置**：仍在 **Web** 分頁下方

如果 Reload 按鈕旁顯示紅色 X（表示運行出錯）：

1. 向下滑到 **Logs** 區塊
2. 點 **Error log** 連結（會開新視窗）
3. 檢查最新的錯誤訊息

**常見錯誤**：
```
ModuleNotFoundError: No module named 'models'
```

→ 檢查 WSGI 檔案的 sys.path 路徑是否正確，特別是大小寫和帳戶名

#### 測試 API

**位置**：瀏覽器新分頁

在瀏覽器複製貼上：

```
https://<username>.pythonanywhere.com/api/config
```

（把 `<username>` 改成你的帳戶名，例如 `https://paec55612.pythonanywhere.com/api/config`）

**正常情況**應返回 JSON：

```json
{
  "long_term_drop": {
    "days": 60,
    "drop_percent": 10
  },
  "rules": [
    {"symbol": "MSFT", "x_days": 5, "y_percent": 5},
    {"symbol": "TSLA", "x_days": 3, "y_percent": 5},
    {"symbol": "APPL", "x_days": 30, "y_percent": 3}
  ]
}
```

#### 測試管理頁面

**位置**：瀏覽器新分頁

訪問：

```
https://<username>.pythonanywhere.com
```

應該看到：
- Vue 前端頁面
- 標題 "Stock Alert Config"
- 一個表格顯示規則（MSFT、TSLA、APPL）
- 上方有編輯框可以修改長期跌幅設定（days、drop_percent）

---

## 更新代碼後的流程

代碼更新後，只需：

**位置**：Bash console

```bash
cd ~/<project-directory>
git pull
```

然後回到 **Web** 標籤，點 **Reload** 按鈕重新加載。

（不需要重新執行 prepare 腳本，除非有新的 Python 依賴需要安裝）

---

## 資料庫相關操作

#### 檢查資料庫狀態

**位置**：Bash console

```bash
sqlite3 ~/<project-directory>/backend/config.db
```

進到 SQLite 提示符後：

```sql
-- 查看規則
SELECT * FROM stock_config;

-- 查看全域設定
SELECT * FROM global_config;

-- 離開
.quit
```

#### 初始化或補齊資料庫

`backend/init_db.py` 使用 `CREATE TABLE IF NOT EXISTS`，不會刪除既有規則；只有空表才會加入範例資料。仍不要在正式環境執行不必要的資料庫操作。

**位置**：Bash console

```bash
cd ~/<project-directory>
python backend/init_db.py
```

然後回到 **Web** 分頁 Reload

---

## 常見問題排查

| 症狀 | 原因 | 解決方法 |
|------|------|---------|
| ❌ 紅色 X | WSGI 有語法錯誤或 import 問題 | **Web** 分頁 → **Error log** 查看詳細錯誤 |
| `ModuleNotFoundError: No module named 'models'` | sys.path 路徑不對或目錄名大小寫錯誤 | 重新編輯 WSGI 檔案，確認 `/home/<username>/<project-directory>` 路徑正確 |
| `ModuleNotFoundError: No module named 'backend'` | 沒有加入根目錄到 sys.path | WSGI 檔案要同時加入根目錄和 backend 目錄的兩行 |
| 404 Not Found | WSGI 檔案沒被正確加載 | **Web** 分頁檢查 WSGI configuration file 路徑 |
| 頁面空白（只有白色背景） | Flask 靜態檔案加載失敗或 CSS 加載錯誤 | **Web** 分頁 → **Access log** 查看是否有 404 錯誤（通常不是此問題，Flask 已配置好） |
| 修改了代碼但頁面沒更新 | WSGI 快取 | 回到 **Web** 分頁點 **Reload** 按鈕強制重新加載 |

### 快速排查步驟

1. **第一步**：檢查 Reload 按鈕旁的狀態
   - 🟢 綠色勾勾 = 正常
   - 🔴 紅色 X = 有問題

2. **第二步**（如果是紅色）：進 **Web** 分頁 → **Logs** 下方 → **Error log**

3. **第三步**：看錯誤訊息的最後一行，判斷問題類型

4. **第四步**：根據上面的表格對症下藥

---


## WSGI 注意事項

本專案不使用 `backend/wsgi.py`。請直接編輯 PythonAnywhere Web 分頁提供的預設 WSGI 檔案，並填入 Linux 專案路徑；不要在 Windows 產生帶有本機路徑的自訂 WSGI 檔案。

---

## 參考資料

- PythonAnywhere 官方文件：https://help.pythonanywhere.com/
- 部署 Flask 應用：https://help.pythonanywhere.com/pages/Flask/
- Debugging import error：https://help.pythonanywhere.com/pages/DebuggingImportError/
