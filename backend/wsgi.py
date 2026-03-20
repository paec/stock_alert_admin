"""WSGI entrypoint for PythonAnywhere."""
import os
import sys
from pathlib import Path

ROOT = Path(r"C:\Python\StockAlertAdmin")
BACKEND = ROOT / "backend"

if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))
os.environ.setdefault("STOCKALERT_DEBUG", "false")

from app import app as application
