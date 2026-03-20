import os
import requests

GH_TOKEN = os.getenv("GH_TOKEN")
repo = "paec/stock_alert_job"
workflow_file = "check_stock.yml"
branch = "master"

url = f"https://api.github.com/repos/{repo}/actions/workflows/{workflow_file}/dispatches"

headers = {
    "Accept": "application/vnd.github+json",
    "Authorization": f"Bearer {GH_TOKEN}"
}

data = {
    "ref": branch
}

resp = requests.post(url, json=data, headers=headers)
print(resp.status_code, resp.text)