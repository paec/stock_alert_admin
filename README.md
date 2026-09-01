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
  web/              # Vue 3 frontend (Vite-based)
    src/            # Source files
      main.js       # App entry point
      App.vue       # Root component
      router/       # Vue Router configuration
      views/        # Page components (HomeView, AdminView)
      components/   # Reusable components
      services/     # API service layer
      assets/       # Styles and assets
    dist/           # Built output, committed for Flask/PythonAnywhere deployment
    package.json    # Frontend dependencies
    vite.config.js  # Vite configuration
  local_prepare.py  # One-shot local setup helper
  execJob.py        # Trigger StockAlertJob GitHub Actions workflow
  pythonanywhere_prepare.py   # One-shot deployment setup helper
  requirements.txt
  FRONTEND_MIGRATION.md  # Detailed migration guide
```

## Requirements

- Python 3.10+ (recommended)
- pip
- Node.js 18+ and npm (for frontend development)

Install Python dependencies:

```powershell
pip install -r requirements.txt
```

Install frontend dependencies:

```powershell
cd web
npm ci
```

## Local Setup

1. Run one-shot local preparation script:

```powershell
python local_prepare.py
```

This script:
- Upgrades pip
- Installs Python dependencies from `requirements.txt`
- Installs frontend dependencies with `npm ci`
- Builds the Vue SFC frontend with `npm run build`
- Initializes SQLite DB (`backend/config.db`)

2. Confirm the production frontend exists:

```powershell
Test-Path web/dist/index.html
```

The command must return `True`. The generated `web/dist/` must be committed and pushed with the backend code.

3. Start API + Web server (from project root):

```powershell
python backend/app.py
```

The Flask backend serves the built frontend from `web/dist/`.

4. Open Admin Web UI:

```text
http://127.0.0.1:5000
```

### Frontend Development Mode

For frontend development with hot reload:

1. Build and start backend (first terminal):

```powershell
python backend/app.py
```

2. Start Vite dev server (second terminal):

```powershell
cd web
npm run dev
```

3. Open development UI:

```text
http://localhost:5173
```

The Vite dev server proxies API calls to the Flask backend.

For more details, see [FRONTEND_MIGRATION.md](FRONTEND_MIGRATION.md).

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

### GET /api/add-more

Records that a symbol was additionally purchased today. The symbol is passed as
a query parameter and is normalized to uppercase.

```text
/api/add-more?symbol=AAPL
```

Success response:

```json
{
  "status": "ok"
}
```

Calling this endpoint more than once for the same symbol on the same date is
idempotent.

### GET /api/add-more/status

Returns whether the symbol has been additionally purchased today:

```text
/api/add-more/status?symbol=AAPL
```

The response is a JSON boolean: `true` when today's record exists, otherwise
`false`.

## Database file

`backend/config.db` is intentionally excluded from Git by `.gitignore`. Each environment keeps its own SQLite database, so `git pull` does not synchronize or overwrite the local database file.

Run `python backend/init_db.py` to create the database tables and seed the default data when the database does not exist. The same initialization is performed by `local_prepare.py` and `pythonanywhere_prepare.py`.


## Deployment

The production frontend is built into `web/dist/` and served by Flask. For the complete PythonAnywhere deployment procedure, including WSGI configuration, environment variables, reload, and troubleshooting, see [PYTHONANYWHERE_DEPLOY_SOP.md](PYTHONANYWHERE_DEPLOY_SOP.md).

Debug mode behavior
-------------------

The Flask debug server is enabled by default when running `python app.py` locally. This is controlled by the environment variable `STOCKALERT_DEBUG`:

- Default (local): `STOCKALERT_DEBUG=true` → debug enabled.
- Production: set `STOCKALERT_DEBUG=false` → debug disabled.

Do not expose the Flask debug server in production; ensure `STOCKALERT_DEBUG` is set to `false` on any public deployment. For the PythonAnywhere setting procedure, see [PYTHONANYWHERE_DEPLOY_SOP.md](PYTHONANYWHERE_DEPLOY_SOP.md).

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

- SQLite DB file is `backend/config.db` and is intentionally not tracked by Git.
- `POST /api/config` updates `global_config` and fully replaces `stock_config` in a single transaction.
- If `global_config` row is missing, `GET /api/config` falls back to defaults (`days=60`, `drop_percent=10`).
- Consider adding auth and audit log before exposing this service publicly.
