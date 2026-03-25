from models import DB_PATH, get_db

DEFAULT_LONG_TERM_DAYS = 60
DEFAULT_LONG_TERM_DROP_PERCENT = 10.0


def init_db():
    conn = get_db()

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS stock_config (
            symbol TEXT PRIMARY KEY,
            x_days INTEGER NOT NULL,
            y_percent REAL NOT NULL
        )
        """
    )

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS global_config (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            long_term_drop_days INTEGER NOT NULL,
            long_term_drop_percent REAL NOT NULL
        )
        """
    )

    # Seed example data if table is empty.
     # {"c": 0} 表示 stock_config 表中沒有任何行，{"c": 3} 表示有三行數據。
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

    global_count = conn.execute("SELECT COUNT(*) AS c FROM global_config").fetchone()["c"]
    if global_count == 0:
        conn.execute(
            """
            INSERT INTO global_config (id, long_term_drop_days, long_term_drop_percent)
            VALUES (1, ?, ?)
            """,
            (DEFAULT_LONG_TERM_DAYS, DEFAULT_LONG_TERM_DROP_PERCENT),
        )

    conn.commit()
    conn.close()


if __name__ == "__main__":
    init_db()
    print(f"Database initialized at: {DB_PATH}")
