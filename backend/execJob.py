import os
import requests

DEFAULT_REPO = os.getenv("GH_REPO", "paec/stock_alert_job")
DEFAULT_WORKFLOW_FILE = os.getenv("GH_WORKFLOW_FILE", "check_stock.yml")
DEFAULT_BRANCH = os.getenv("GH_WORKFLOW_BRANCH", "master")


def _to_workflow_bool(value):
    return "true" if bool(value) else "false"


def trigger_stock_alert_workflow(force_send_report=False):
    """Dispatch GitHub Actions workflow for stock alert job."""
    gh_token = os.getenv("GH_TOKEN")
    if not gh_token:
        raise RuntimeError("Missing GH_TOKEN environment variable")

    url = (
        f"https://api.github.com/repos/{DEFAULT_REPO}/actions/workflows/"
        f"{DEFAULT_WORKFLOW_FILE}/dispatches"
    )

    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {gh_token}",
    }

    payload = {
        "ref": DEFAULT_BRANCH,
        "inputs": {
            "force_send_report": _to_workflow_bool(force_send_report),
        },
    }

    response = requests.post(url, json=payload, headers=headers, timeout=20)
    if response.status_code != 204:
        raise RuntimeError(
            f"GitHub workflow dispatch failed ({response.status_code}): {response.text}"
        )

    return {
        "status": "ok",
        "message": "Workflow dispatched successfully",
        "repo": DEFAULT_REPO,
        "workflow_file": DEFAULT_WORKFLOW_FILE,
        "branch": DEFAULT_BRANCH,
        "force_send_report": _to_workflow_bool(force_send_report),
    }


if __name__ == "__main__":
    env_force_send_report = os.getenv("FORCE_SEND_REPORT", "false").lower() in (
        "1",
        "true",
        "yes",
        "on",
    )
    result = trigger_stock_alert_workflow(env_force_send_report)
    print(result)