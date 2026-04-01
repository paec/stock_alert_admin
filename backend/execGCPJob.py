from google.oauth2 import service_account
from google.cloud import scheduler_v1
# 你的專案資訊
PROJECT_ID = "project-e3be13eb-4f53-4e08-9da"
LOCATION = "asia-east1"
JOB_ID = "github-trigger-job-stock"

# 指定你的 JSON 金鑰路徑
KEY_PATH = "./GCPSA.json"
credentials = service_account.Credentials.from_service_account_file(KEY_PATH)


def manage_cloud_scheduler_job():
    # 初始化 Client
    client = scheduler_v1.CloudSchedulerClient(credentials=credentials)

    # 組合 Job 的完整資源名稱路徑
    # 格式: projects/[PROJECT_ID]/locations/[LOCATION]/jobs/[JOB_ID]
    job_path = client.job_path(PROJECT_ID, LOCATION, JOB_ID)

    # --- 1. 查詢目前的 Job 設定 ---
    print(f"正在查詢 Job: {JOB_ID} ...")
    current_job = client.get_job(name=job_path)
    print(f"目前的 Cron 設定: {current_job.schedule}")
    print(f"目前的時區: {current_job.time_zone}")
    print("-" * 30)

    # # --- 2. 修改啟動時間 (例如改為每小時整點 0 分執行) ---
    # new_schedule = "0 * * * *"  # 在此填入你想要的 Cron 設定
    
    # # 建立 Job 物件，只需包含名稱和要修改的欄位
    # job = scheduler_v1.Job(
    #     name=job_path,
    #     schedule=new_schedule
    # )

    # # 使用 update_mask 指定只更新 'schedule' 這個欄位，避免覆蓋其他設定
    # update_mask = {"paths": ["schedule"]}

    # print(f"正在將 Cron 修改為: {new_schedule} ...")
    # updated_job = client.update_job(job=job, update_mask=update_mask)

    # print("修改成功！")
    # print(f"更新後的 Job 資訊: {updated_job.name}")
    # print(f"新的執行時間: {updated_job.schedule}")

if __name__ == "__main__":
    try:
        manage_cloud_scheduler_job()
    except Exception as e:
        print(f"發生錯誤: {e}")
