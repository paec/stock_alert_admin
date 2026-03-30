import os
import requests
# 這是一個手動執行腳本，我要實作一個讓它改成後端能call的function，能讓前端呼叫

GH_TOKEN = os.getenv("GH_TOKEN")
FORCE_SEND_REPORT = os.getenv("FORCE_SEND_REPORT", "false") # 要改從前端UI傳入

repo = "paec/stock_alert_job"
workflow_file = "check_stock.yml"
branch = "master"

url = f"https://api.github.com/repos/{repo}/actions/workflows/{workflow_file}/dispatches"

headers = {
    "Accept": "application/vnd.github+json",
    "Authorization": f"Bearer {GH_TOKEN}"
}

data = {
    "ref": branch,
    "inputs": {
        "force_send_report": FORCE_SEND_REPORT
    }
}

resp = requests.post(url, json=data, headers=headers)
print(resp.status_code, resp.text)