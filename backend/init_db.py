from models import DB_PATH, get_db


def init_db():
    conn = get_db()

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS stock_config (
            symbol TEXT,
            x_days INTEGER,
            y_percent REAL
        )
        """
    )

    # Seed example data if table is empty.
    count = conn.execute("SELECT COUNT(*) AS c FROM stock_config").fetchone()["c"]
    if count == 0:
        example_data = [
            ("MSFT", 5, 5),
            ("TSLA", 3, 5),
            ("APPL", 30, 3)
        ]
        conn.executemany(
            "INSERT INTO stock_config (symbol, x_days, y_percent) VALUES (?, ?, ?)",
            example_data
        )

    conn.commit()
    conn.close()


if __name__ == "__main__":
    init_db()
    print(f"Database initialized at: {DB_PATH}")
