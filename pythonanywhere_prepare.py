"""One-shot setup script for deploying this repo on PythonAnywhere.

Usage on PythonAnywhere bash console:
    python pythonanywhere_prepare.py

This script is idempotent and safe to run multiple times.
"""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent
BACKEND_DIR = ROOT / "backend"
REQUIREMENTS = ROOT / "requirements.txt"
INIT_DB_SCRIPT = BACKEND_DIR / "init_db.py"


def run(cmd: list[str], desc: str) -> None:
    print(f"\n[STEP] {desc}")
    print("[CMD]", " ".join(cmd))
    subprocess.run(cmd, check=True)


def main() -> int:
    print("PythonAnywhere setup started")
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

    print("\nSetup complete.")
    print("Next steps on PythonAnywhere Web tab:")
    print("1) Edit the WSGI configuration file (in Web tab)")
    print("2) Add the following sys.path configuration:")
    print("   sys.path.insert(0, '/home/<username>/stock_alert_admin')")
    print("   sys.path.insert(0, '/home/<username>/stock_alert_admin/backend')")
    print("3) Import app: from app import app as application")
    print("4) Reload web app")
    print("5) Test endpoint: /api/config")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
