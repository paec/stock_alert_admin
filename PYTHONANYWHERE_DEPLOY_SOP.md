# PythonAnywhere 部署 SOP

基於實際部署經驗整理。

---

## 前置準備（本地）

1. 確保代碼能在本地跑：
   ```bash
   python local_prepare.py
   python backend/app.py
   ```

2. 測試可訪問：`http://127.0.0.1:5000/api/config`

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

輸出應該是：
```
[STEP] Upgrade pip
[STEP] Install requirements
[STEP] Initialize SQLite database

Setup complete.

Next steps on PythonAnywhere Web tab:
1) Edit the WSGI configuration file (in Web tab)
...
```

✅ 看到這些訊息就表示成功了

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

# 注意：目錄名是小寫 stock_alert_admin（大小寫敏感！）
# 把 <username> 改成你的帳戶名
sys.path.insert(0, '/home/<username>/stock_alert_admin')
sys.path.insert(0, '/home/<username>/stock_alert_admin/backend')

from app import app as application

os.environ.setdefault("STOCKALERT_DEBUG", "false")
```

⚠️ **重要**：
- 把 `<username>` 改成你的實際帳戶名（例如 `paec55612`）
- 注意小寫 `stock_alert_admin`（不是 `StockAlertAdmin`）

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
cd ~/stock_alert_admin
git pull
```

然後回到 **Web** 標籤，點 **Reload** 按鈕重新加載。

（不需要重新執行 prepare 腳本，除非有新的 Python 依賴需要安裝）

---

## 資料庫相關操作

#### 檢查資料庫狀態

**位置**：Bash console

```bash
sqlite3 ~/stock_alert_admin/backend/config.db
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

#### 重新初始化資料庫

**⚠️ 警告**：這會刪除所有規則和設定！

**位置**：Bash console

```bash
cd ~/stock_alert_admin
python backend/init_db.py
```

然後回到 **Web** 分頁 Reload

---

## 常見問題排查

| 症狀 | 原因 | 解決方法 |
|------|------|---------|
| ❌ 紅色 X | WSGI 有語法錯誤或 import 問題 | **Web** 分頁 → **Error log** 查看詳細錯誤 |
| `ModuleNotFoundError: No module named 'models'` | sys.path 路徑不對或目錄名大小寫錯誤 | 重新編輯 WSGI 檔案，確認 `/home/<username>/stock_alert_admin` 路徑正確 |
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

## 資料庫相關

#### 初始化資料庫

已在 `pythonanywhere_prepare.py` 中執行過，應該無需再做。

#### 重新初始化資料庫

如果需要清空再初始化（會丟失所有規則！）：

```bash
cd ~/stock_alert_admin
python backend/init_db.py
```

#### 檢查資料庫狀態

```bash
sqlite3 ~/stock_alert_admin/backend/config.db
sqlite> SELECT * FROM stock_config;
sqlite> SELECT * FROM global_config;
sqlite> .quit
```

---

## 為什麼不能用 prepare 產生 wsgi.py？

`pythonanywhere_prepare.py` 原本設計會產生 `backend/wsgi.py`，但有問題：

1. **在本地 Windows 執行時**，wsgi.py 會嵌入 Windows 路徑（`C:\Python\StockAlertAdmin`）
2. **上傳到 Linux 的 PythonAnywhere 時**，這個路徑無法使用
3. **結果**：WSGI 加載失敗

**最佳方案**：直接在 PythonAnywhere 的預設 WSGI 檔編輯，用 Linux 路徑設定。

---

## 參考資料

- PythonAnywhere 官方文件：https://help.pythonanywhere.com/
- 部署 Flask 應用：https://help.pythonanywhere.com/pages/Flask/
- Debugging import error：https://help.pythonanywhere.com/pages/DebuggingImportError/
