# StockAlertAdmin

StockAlertAdmin is the admin-side service for StockAlertJob.
It provides:
- A Flask API to read and update stock alert rules.
- A lightweight web UI to edit those rules (served by the same Flask app).
- Helper scripts for PythonAnywhere deployment and GitHub Actions dispatch.

## Contract Alignment With StockAlertJob

StockAlertJob current config contract (already in use) includes two parts:

1. `rules` list: per-symbol short-term drop trigger
2. `long_term_drop` object: global long-term drop trigger

Expected JSON shape:

```json
{
  "long_term_drop": {
    "days": 60,
    "drop_percent": 10
  },
  "rules": [
    {
      "symbol": "VOO",
      "x_days": 5,
      "y_percent": 5
    }
  ]
}
```

Status: implemented in StockAlertAdmin backend and web UI.

## Relationship to StockAlertJob

- StockAlertJob already contains the alert execution logic.
- StockAlertAdmin is responsible for managing:
  - Per-symbol rule source (`symbol`, `x_days`, `y_percent`)
  - Global long-term settings (`long_term_drop.days`, `long_term_drop.drop_percent`)
- StockAlertJob calls StockAlertAdmin API (`GET /api/config`) to load both sections before running checks.

## Project Structure

```text
StockAlertAdmin/
  backend/
    app.py          # Flask API
    init_db.py      # SQLite schema + seed data
    models.py       # DB connection helper
    wsgi.py         # PythonAnywhere WSGI entrypoint
  local_prepare.py  # One-shot local setup helper
  web/              # Vue-based frontend (multiple pages, components, styles)
    components/     # Reusable Vue components
    views/          # Page-level Vue components
    (HTML pages, app.js, styles.css)
  execJob.py        # Trigger StockAlertJob GitHub Actions workflow
  pythonanywhere_prepare.py   # One-shot deployment setup helper
  requirements.txt
```

## Requirements

- Python 3.10+ (recommended)
- pip

Install dependencies:

```powershell
pip install -r requirements.txt
```

## Local Setup

1. Run one-shot local preparation script:

```powershell
python local_prepare.py
```

This script:
- Upgrades pip
- Installs dependencies from `requirements.txt`
- Initializes SQLite DB (`backend/config.db`)

2. Start API + Web server (from project root):

```powershell
python backend/app.py
```

3. Open Admin Web UI:

```text
http://127.0.0.1:5000
```

4. API endpoint:

```powershell
http://127.0.0.1:5000/api/config
```

## API

### GET /api/config

Returns all config used by StockAlertJob.

Response example:

```json
{
  "long_term_drop": {
    "days": 60,
    "drop_percent": 10
  },
  "rules": [
    {
      "symbol": "MSFT",
      "x_days": 5,
      "y_percent": 5.0
    }
  ]
}
```

### POST /api/config

Replaces all config with payload data.

Request body:

```json
{
  "long_term_drop": {
    "days": 60,
    "drop_percent": 10
  },
  "rules": [
    {
      "symbol": "AAPL",
      "x_days": 3,
      "y_percent": 4.5
    }
  ]
}
```

Validation notes:
- `rules` must be a list.
- Each item must include `symbol`, `x_days`, `y_percent`.
- `symbol` is normalized to uppercase.
- `x_days` is converted to integer.
- `y_percent` is converted to float.
- `long_term_drop.days` must be positive integer.
- `long_term_drop.drop_percent` must be positive number.

Success response:

```json
{
  "status": "ok"
}
```

Error response:

```json
{
  "status": "error",
  "message": "Invalid payload"
}
```

## Admin Web UI

The frontend in `web/` is Vue-based (loaded via CDN).
In local development, the same Flask process serves both API and web UI.

The UI calls:
- `GET /api/config` on page load.
- `POST /api/config` on save.

In production, serve `web/` and reverse-proxy `/api/*` to Flask backend.

## Frontend dependencies (CDN)

The frontend loads UI libs from CDNs. Current notable versions used in the repository:

- Vue 3 (`vue@3/dist/vue.global.js`)
- PrimeVue (3.53.0)
- PrimeIcons
- Tabulator (6.2.1)
- Google Fonts: `Outfit`, `IBM Plex Mono`

These are included via `<script>`/`<link>` tags in the HTML templates. No npm build is required for the shipped UI.

## Local dev notes for the Web UI

- When editing frontend code in `web/`, open the page in a browser and hard-refresh (clear cache) to pick up updated CDN bundles.
- The frontend performs normalization and validation before sending `POST /api/config` (symbols uppercased, numeric conversion, basic range checks).

## Database file in repository

This repository currently contains a SQLite DB at `backend/config.db` (committed as a binary file). Recommended options:

1. Remove `backend/config.db` from the repository and add `backend/config.db` to `.gitignore`; provide `backend/init_db.py` or `local_prepare.py` as the canonical way to create/seed a local DB sample.
2. Or keep a small sample DB but clearly mark it as a sample/test DB in this README and avoid using it for production.


## PythonAnywhere Deployment

**Note:** Do NOT use `pythonanywhere_prepare.py` to generate `backend/wsgi.py` on Windows—the script will embed Windows paths that fail on PythonAnywhere (Linux).

Instead, follow the detailed guide in [PYTHONANYWHERE_DEPLOY_SOP.md](PYTHONANYWHERE_DEPLOY_SOP.md).  
In summary:

1. Clone repo to PythonAnywhere home directory
2. Use pip to install dependencies (from the Linux shell on PythonAnywhere)
3. Initialize SQLite DB using `python backend/init_db.py` on PythonAnywhere
4. Edit the **default** WSGI config file in the Web tab with Linux paths (do not use `backend/wsgi.py`)
5. Reload web app and test `/api/config`

For detailed steps, environment variables, and troubleshooting, see [PYTHONANYWHERE_DEPLOY_SOP.md](PYTHONANYWHERE_DEPLOY_SOP.md).

Debug mode behavior
-------------------

The Flask debug server is enabled by default when running `python app.py` locally. This is controlled by the environment variable `STOCKALERT_DEBUG`:

- Default (local): `STOCKALERT_DEBUG=true` → debug enabled.
- Production: set `STOCKALERT_DEBUG=false` → debug disabled.

On PythonAnywhere you can set the environment variable in two ways:

- Preferred (Web console): In the PythonAnywhere Web tab, add `STOCKALERT_DEBUG` with value `false` under "Environment variables" for your web app, then Reload.
- Alternate (wsgi): `backend/wsgi.py` contains a `os.environ.setdefault("STOCKALERT_DEBUG", "false")` line that will set a default of `false` when the WSGI process starts.

Do not expose the Flask debug server in production; ensure `STOCKALERT_DEBUG` is set to `false` on any public deployment.

## Trigger StockAlertJob Workflow

`execJob.py` sends a workflow dispatch request to GitHub Actions.

Required environment variable:
- `GH_TOKEN`: GitHub token with workflow dispatch permission on `paec/stock_alert_job`

Run:

```powershell
$env:GH_TOKEN="<your-token>"
python execJob.py
```

## Notes

- SQLite DB file is `backend/config.db`.
- `POST /api/config` updates `global_config` and fully replaces `stock_config` in a single transaction.
- If `global_config` row is missing, `GET /api/config` falls back to defaults (`days=60`, `drop_percent=10`).
- Consider adding auth and audit log before exposing this service publicly.
