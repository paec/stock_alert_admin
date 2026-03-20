# Stock Alert Admin MVP

A minimal project skeleton:
- `backend/`: Flask API + SQLite config store (`stock_config` table)
- `script/`: Scheduled stock checker for GitHub Actions
- `web/`: Vue 3 progressive frontend (CDN, no build step)

## Project Structure

```text
project
|
|- backend/
|  |- app.py
|  |- models.py
|  |- init_db.py
|  |- config.db
|
|- script/
|  |- check_stock.py (moved to stockalertjob)
|
|- web/
|  |- index.html
|  |- app.js
|
|- .github/workflows/
|  |- check_stock.yml (moved to stockalertjob)
|
|- requirements.txt
```

## 1. Install dependencies

```bash
pip install -r requirements.txt
```

## 2. Initialize database

```bash
python backend/init_db.py
```

## 3. Run Flask API locally

```bash
python backend/app.py
```

API:
- `GET /api/config`
- `POST /api/config`

Payload format:

```json
{
	"rules": [
		{ "symbol": "MSFT", "x_days": 5, "y_percent": 5 },
		{ "symbol": "TSLA", "x_days": 3, "y_percent": 5 },
		{ "symbol": "APPL", "x_days": 30, "y_percent": 3 }
	]
}
```

## 4. Frontend

Open `web/index.html` in your browser.

If frontend and backend are on different domains, configure reverse proxy or CORS.
