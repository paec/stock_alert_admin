"""WSGI entrypoint for PythonAnywhere."""
import sys
from pathlib import Path

ROOT = Path(r"C:\Python\StockAlertAdmin")
BACKEND = ROOT / "backend"

if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

from app import app as application
