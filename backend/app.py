from flask import Flask, jsonify, request
import os

from models import get_db

app = Flask(__name__)

DEFAULT_LONG_TERM_DAYS = 60
DEFAULT_LONG_TERM_DROP_PERCENT = 10.0


def _invalid_payload_response():
    return jsonify({"status": "error", "message": "Invalid payload"}), 400


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
    data = request.get_json(silent=True) or {}

    rules = data.get("rules")
    if not isinstance(rules, list):
        return _invalid_payload_response()

    long_term_drop = data.get("long_term_drop")
    if not isinstance(long_term_drop, dict):
        return _invalid_payload_response()

    long_term_days = long_term_drop.get("days")
    long_term_drop_percent = long_term_drop.get("drop_percent")
    if long_term_days is None or long_term_drop_percent is None:
        return _invalid_payload_response()

    try:
        parsed_long_term_days = int(long_term_days)
        parsed_long_term_drop_percent = float(long_term_drop_percent)
    except (TypeError, ValueError):
        return _invalid_payload_response()

    if parsed_long_term_days <= 0 or parsed_long_term_drop_percent <= 0:
        return _invalid_payload_response()

    cleaned_rules = []
    for item in rules:
        if not isinstance(item, dict):
            return _invalid_payload_response()

        symbol = str(item.get("symbol", "")).strip().upper()
        x_days = item.get("x_days")
        y_percent = item.get("y_percent")

        if not symbol or x_days is None or y_percent is None:
            return _invalid_payload_response()

        try:
            parsed_x_days = int(x_days)
            parsed_y_percent = float(y_percent)
        except (TypeError, ValueError):
            return _invalid_payload_response()

        if parsed_x_days <= 0 or parsed_y_percent <= 0:
            return _invalid_payload_response()

        cleaned_rules.append((symbol, parsed_x_days, parsed_y_percent))

    conn = get_db()
    try:
        conn.execute(
            """
            INSERT INTO global_config (id, long_term_drop_days, long_term_drop_percent)
            VALUES (1, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                long_term_drop_days = excluded.long_term_drop_days,
                long_term_drop_percent = excluded.long_term_drop_percent
            """,
            (parsed_long_term_days, parsed_long_term_drop_percent),
        )

        conn.execute("DELETE FROM stock_config")
        for symbol, x_days, y_percent in cleaned_rules:
            conn.execute(
                "INSERT INTO stock_config (symbol, x_days, y_percent) VALUES (?,?,?)",
                (symbol, x_days, y_percent),
            )

        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

    return jsonify({"status": "ok"})


if __name__ == "__main__":
    debug_env = os.getenv("STOCKALERT_DEBUG", "true")
    debug = str(debug_env).lower() in ("1", "true", "yes", "on")
    app.run(debug=debug)