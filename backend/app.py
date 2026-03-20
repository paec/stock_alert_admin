from flask import Flask, jsonify, request

from models import get_db

app = Flask(__name__)


@app.route("/api/config", methods=["GET"])
def get_config():
    conn = get_db()
    rules = conn.execute(
        "SELECT symbol, x_days, y_percent FROM stock_config"
    ).fetchall()
    conn.close()

    return jsonify(
        {
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
        return jsonify({"status": "error", "message": "Invalid payload"}), 400

    cleaned_rules = []
    for item in rules:
        if not isinstance(item, dict):
            return jsonify({"status": "error", "message": "Invalid payload"}), 400

        symbol = str(item.get("symbol", "")).strip().upper()
        x_days = item.get("x_days")
        y_percent = item.get("y_percent")

        if not symbol or x_days is None or y_percent is None:
            return jsonify({"status": "error", "message": "Invalid payload"}), 400

        try:
            cleaned_rules.append((symbol, int(x_days), float(y_percent)))
        except (TypeError, ValueError):
            return jsonify({"status": "error", "message": "Invalid payload"}), 400

    conn = get_db()
    conn.execute("DELETE FROM stock_config")
    for symbol, x_days, y_percent in cleaned_rules:
        conn.execute(
            "INSERT INTO stock_config (symbol, x_days, y_percent) VALUES (?,?,?)",
            (symbol, x_days, y_percent),
        )

    conn.commit()
    conn.close()

    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(debug=True)
