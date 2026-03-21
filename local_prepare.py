"""One-shot setup script for local development.

Usage (PowerShell):
    python local_prepare.py

This script is idempotent and safe to run multiple times.
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent
REQUIREMENTS = ROOT / "requirements.txt"
INIT_DB_SCRIPT = ROOT / "backend" / "init_db.py"


def run(cmd: list[str], desc: str) -> None:
    print(f"\n[STEP] {desc}")
    print("[CMD]", " ".join(cmd))
    subprocess.run(cmd, check=True)


def main() -> int:
    print("Local setup started")
    print(f"Project root: {ROOT}")

    if not REQUIREMENTS.exists():
        print(f"[ERROR] Missing file: {REQUIREMENTS}")
        return 1

    if not INIT_DB_SCRIPT.exists():
        print(f"[ERROR] Missing file: {INIT_DB_SCRIPT}")
        return 1

    run([sys.executable, "-m", "pip", "install", "--upgrade", "pip"], "Upgrade pip")
    run([sys.executable, "-m", "pip", "install", "-r", str(REQUIREMENTS)], "Install requirements")
    run([sys.executable, str(INIT_DB_SCRIPT)], "Initialize SQLite database")

    print("\nLocal setup complete.")
    print("Next steps:")
    print("1) Start the server: python backend/app.py")
    print("2) Open: http://127.0.0.1:5000")
    print("3) API health: http://127.0.0.1:5000/api/config")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
