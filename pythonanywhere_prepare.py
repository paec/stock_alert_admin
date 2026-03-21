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
WSGI_FILE = BACKEND_DIR / "wsgi.py"


def run(cmd: list[str], desc: str) -> None:
    print(f"\n[STEP] {desc}")
    print("[CMD]", " ".join(cmd))
    subprocess.run(cmd, check=True)


def write_wsgi_file() -> None:
    content = f'''"""WSGI entrypoint for PythonAnywhere."""
import os
import sys
from pathlib import Path

ROOT = Path(r"{ROOT}")
BACKEND = ROOT / "backend"

if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))
os.environ.setdefault("STOCKALERT_DEBUG", "false")

from app import app as application
'''
    WSGI_FILE.write_text(content, encoding="utf-8")
    print(f"[OK] WSGI file ready: {WSGI_FILE}")


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

    write_wsgi_file()

    print("\nSetup complete.")
    print("Next steps on PythonAnywhere Web tab:")
    print("1) Set WSGI configuration file to use backend/wsgi.py")
    print(f"   Suggested path: {WSGI_FILE}")
    print("2) Reload web app")
    print("3) Test endpoint: /api/config")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
