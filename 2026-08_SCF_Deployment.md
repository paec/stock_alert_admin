# Vue SFC 升級後 PythonAnywhere 首次部署流程

適用日期：2026 年 8 月

本流程適用於原本使用 CDN Vue，現在升級為 Vue 3 + Vite + SFC 的第一次部署。

## 一、本地端建立前端正式檔案

在專案根目錄執行：

```powershell
cd web
npm ci
npm run build
cd ..
``` 

確認檔案存在：

```powershell
Test-Path `index.html`
``` 

結果必須是：

```text
True
``` 

將前端編譯結果與程式碼一起提交：

```powershell
git add web/dist
git commit -m "Upgrade frontend to Vue SFC"
git push
``` 

`web/dist/` 必須包含：

- `index.html`
- `assets/` 資料夾
- 編譯後的 JavaScript、CSS 與字型檔案

## 二、PythonAnywhere 更新程式碼

開啟 PythonAnywhere Bash console：

```bash
cd ~/<project-directory>
git pull
``` 

確認前端檔案存在：

```bash
test -f web/dist/index.html && echo "Frontend build found"
``` 

## 三、執行部署準備腳本

每次部署固定執行：

```bash
python pythonanywhere_prepare.py
```

此腳本會：

- 安裝或更新 Python dependencies
- 檢查 SQLite 資料表，必要時建立資料表
- 確認 `index.html` 存在

目前的 `config.db` 不受 Git 追蹤，因此 `git pull` 不會覆蓋 PythonAnywhere 上既有的資料庫內容。

## 四、確認 WSGI 設定

如果原本 CDN Vue 版本使用的 WSGI 路徑沒有改變，通常不需要修改 WSGI。

確認內容包含實際的 PythonAnywhere 專案路徑：

```python
import sys
import os

sys.path.insert(0, '/home/<username>/<project-directory>')
sys.path.insert(0, '/home/<username>/<project-directory>/backend')

from app import app as application

os.environ.setdefault("STOCKALERT_DEBUG", "false")
``` 

只有以下情況才需要修改：

- 專案資料夾名稱改變
- PythonAnywhere 帳號改變
- WSGI 路徑設定錯誤
- 出現 `ModuleNotFoundError`

## 五、確認環境變數

如果原本已設定，通常不需要重新設定：

- `GH_TOKEN`
- `STOCKALERT_DEBUG=false`

`GH_TOKEN` 用於管理頁面手動觸發 GitHub Actions。

## 六、Reload Web App

在 PythonAnywhere Web 頁面按：

```text
Reload <username>.pythonanywhere.com
```

等待網站重新啟動。

## 七、部署驗證

測試 API：

```text
https://<username>.pythonanywhere.com/api/config
```

確認回傳 JSON。

再開啟：

```text
https://<username>.pythonanywhere.com
``` 

確認：

- Vue SFC 頁面正常顯示
- CSS 樣式正常
- JavaScript 沒有載入錯誤
- 設定資料可以讀取
- 儲存設定功能正常
- 管理頁面與手動觸發功能正常

## 日後每次更新流程

本地：

```powershell
cd web
npm ci
npm run build
cd ..
git add web/dist
git commit -m "Update frontend"
git push
```

PythonAnywhere：

```bash
cd ~/<project-directory>
git pull
python pythonanywhere_prepare.py
```

最後到 Web 頁面按 **Reload**。
