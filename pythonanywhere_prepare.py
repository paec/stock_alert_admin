"""One-shot setup script for deploying this repo on PythonAnywhere.

Usage on PythonAnywhere bash console:
    python pythonanywhere_prepare.py

This script is idempotent and safe to run multiple times.
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent
BACKEND_DIR = ROOT / "backend"
REQUIREMENTS = ROOT / "requirements.txt"
INIT_DB_SCRIPT = BACKEND_DIR / "init_db.py"
DIST_INDEX = ROOT / "web" / "dist" / "index.html"


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

    if not DIST_INDEX.exists():
        print(f"[ERROR] Missing built frontend: {DIST_INDEX}")
        print("Build web/dist locally with 'npm ci' and 'npm run build', then commit and push it.")
        return 1

    run([sys.executable, "-m", "pip", "install", "--upgrade", "pip"], "Upgrade pip")
    run([sys.executable, "-m", "pip", "install", "-r", str(REQUIREMENTS)], "Install requirements")
    run([sys.executable, str(INIT_DB_SCRIPT)], "Initialize SQLite database")

    print("\nSetup complete.")
    print("Next steps on PythonAnywhere Web tab:")
    print("1) Confirm web/dist/ was included in the deployed repository")
    print("2) Edit the WSGI configuration file (in Web tab)")
    print("3) Add the following sys.path configuration:")
    print("   sys.path.insert(0, '/home/<username>/<project-directory>')")
    print("   sys.path.insert(0, '/home/<username>/<project-directory>/backend')")
    print("4) Import app: from app import app as application")
    print("5) Reload web app")
    print("6) Test endpoint: /api/config")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
