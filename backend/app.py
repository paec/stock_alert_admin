from flask import Flask, jsonify, request, send_from_directory
import os
from pathlib import Path

from models import get_db
from execJob import trigger_stock_alert_workflow

ROOT_DIR = Path(__file__).resolve().parent.parent
WEB_DIR = ROOT_DIR / "web"

app = Flask(
    __name__,
    static_folder=str(WEB_DIR),
    static_url_path="",
)

DEFAULT_LONG_TERM_DAYS = 60
DEFAULT_LONG_TERM_DROP_PERCENT = 10.0


def _error_response(message, status_code=400):
    return jsonify({"status": "error", "message": message}), status_code


def _parse_bool(value, field_name):
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        normalized = value.strip().lower()
        if normalized in ("1", "true", "yes", "on"):
            return True
        if normalized in ("0", "false", "no", "off"):
            return False
    raise ValueError(f"{field_name} must be boolean")


def _parse_long_term_drop(data):
    """Validate and parse long_term_drop config."""
    long_term_drop = data.get("long_term_drop")
    if not isinstance(long_term_drop, dict):
        raise ValueError("long_term_drop must be a dict")

    days = long_term_drop.get("days")
    drop_percent = long_term_drop.get("drop_percent")

    if days is None or drop_percent is None:
        raise ValueError("days and drop_percent are required")

    try:
        parsed_days = int(days)
        parsed_percent = float(drop_percent)
    except (TypeError, ValueError):
        raise ValueError("days must be int, drop_percent must be numeric")

    if parsed_days <= 0 or parsed_percent <= 0:
        raise ValueError("days and drop_percent must be > 0")

    return parsed_days, parsed_percent


def _parse_rule(item):
    """Validate and parse a single stock rule."""
    if not isinstance(item, dict):
        raise ValueError("each rule must be a dict")

    symbol = str(item.get("symbol", "")).strip().upper()
    x_days = item.get("x_days")
    y_percent = item.get("y_percent")

    if not symbol or x_days is None or y_percent is None:
        raise ValueError("symbol, x_days, y_percent are all required")

    try:
        parsed_x_days = int(x_days)
        parsed_y_percent = float(y_percent)
    except (TypeError, ValueError):
        raise ValueError("x_days must be int, y_percent must be numeric")

    if parsed_x_days <= 0 or parsed_y_percent <= 0:
        raise ValueError("x_days and y_percent must be > 0")

    return symbol, parsed_x_days, parsed_y_percent


def _parse_rules(rules_data):
    """Validate and parse all stock rules."""
    if not isinstance(rules_data, list):
        raise ValueError("rules must be a list")

    return [_parse_rule(item) for item in rules_data]


@app.route("/")
def serve_web_index():
    # 直接從 static_folder 發送 index.html，確保路徑正確
    # static_folder 已經設置為 WEB_DIR，所以這裡直接發送 index.html 就行了
    return send_from_directory(app.static_folder, "index.html")


@app.route("/api/config", methods=["GET"])
def get_config():
    conn = get_db()
    rules = conn.execute(
        "SELECT symbol, x_days, y_percent FROM stock_config"
    ).fetchall()
    global_cfg = conn.execute(
        "SELECT long_term_drop_days, long_term_drop_percent FROM global_config WHERE id = 1"
    ).fetchone()
    conn.close()

    if global_cfg is None:
        long_term_days = DEFAULT_LONG_TERM_DAYS
        long_term_drop_percent = DEFAULT_LONG_TERM_DROP_PERCENT
    else:
        long_term_days = global_cfg["long_term_drop_days"]
        long_term_drop_percent = global_cfg["long_term_drop_percent"]

    return jsonify(
        {
            "long_term_drop": {
                "days": long_term_days,
                "drop_percent": long_term_drop_percent,
            },
            "rules": [
                {
                    "symbol": r["symbol"],
                    "x_days": r["x_days"],
                    "y_percent": r["y_percent"],
                }
                for r in rules
            ]
        }
    )


@app.route("/api/config", methods=["POST"])
def update_config():
    try:
        data = request.get_json(silent=True) or {}

        # Validate and parse inputs
        long_term_days, long_term_percent = _parse_long_term_drop(data)
        rules = _parse_rules(data.get("rules", []))

        # Update database
        conn = get_db()
        try:
            # Update global_config with UPSERT
            conn.execute(
                """
                INSERT INTO global_config (id, long_term_drop_days, long_term_drop_percent)
                VALUES (1, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    long_term_drop_days = excluded.long_term_drop_days,
                    long_term_drop_percent = excluded.long_term_drop_percent
                """,
                (long_term_days, long_term_percent),
            )

            # Replace stock_config (DELETE + INSERT to reflect frontend deletions)
            conn.execute("DELETE FROM stock_config")
            for symbol, x_days, y_percent in rules:
                conn.execute(
                    "INSERT INTO stock_config (symbol, x_days, y_percent) VALUES (?, ?, ?)",
                    (symbol, x_days, y_percent),
                )

            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

        return jsonify({"status": "ok"})
    except ValueError as e:
        return _error_response(str(e))


@app.route("/api/admin/trigger-job", methods=["POST"])
def trigger_job():
    data = request.get_json(silent=True) or {}

    try:
        force_send_report = _parse_bool(
            data.get("force_send_report", False), "force_send_report"
        )
        result = trigger_stock_alert_workflow(force_send_report=force_send_report)
        return jsonify(result)
    except ValueError as e:
        return _error_response(str(e), 400)
    except RuntimeError as e:
        return _error_response(str(e), 502)


if __name__ == "__main__":
    debug_env = os.getenv("STOCKALERT_DEBUG", "true")
    debug = str(debug_env).lower() in ("1", "true", "yes", "on")
    app.run(debug=debug)