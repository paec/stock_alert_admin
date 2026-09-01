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
WEB_DIR = ROOT / "web"
PACKAGE_LOCK = WEB_DIR / "package-lock.json"
DIST_INDEX = WEB_DIR / "dist" / "index.html"


def run(cmd: list[str], desc: str, cwd: Path | None = None) -> None:
    print(f"\n[STEP] {desc}")
    print("[CMD]", " ".join(cmd))
    subprocess.run(cmd, check=True, cwd=cwd)


def main() -> int:
    print("Local setup started")
    print(f"Project root: {ROOT}")

    if not REQUIREMENTS.exists():
        print(f"[ERROR] Missing file: {REQUIREMENTS}")
        return 1

    if not INIT_DB_SCRIPT.exists():
        print(f"[ERROR] Missing file: {INIT_DB_SCRIPT}")
        return 1

    if not PACKAGE_LOCK.exists():
        print(f"[ERROR] Missing file: {PACKAGE_LOCK}")
        return 1

    run([sys.executable, "-m", "pip", "install", "--upgrade", "pip"], "Upgrade pip")
    run([sys.executable, "-m", "pip", "install", "-r", str(REQUIREMENTS)], "Install requirements")
    npm_command = "npm.cmd" if sys.platform == "win32" else "npm"
    run([npm_command, "ci"], "Install frontend dependencies", cwd=WEB_DIR)
    run([npm_command, "run", "build"], "Build frontend for Flask", cwd=WEB_DIR)
    run([sys.executable, str(INIT_DB_SCRIPT)], "Initialize SQLite database")

    if not DIST_INDEX.exists():
        print(f"[ERROR] Frontend build did not create: {DIST_INDEX}")
        return 1

    print("\nLocal setup complete.")
    print("Next steps:")
    print("1) Start the server: python backend/app.py")
    print("2) Open: http://127.0.0.1:5000")
    print("3) API health: http://127.0.0.1:5000/api/config")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
