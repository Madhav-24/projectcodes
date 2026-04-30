# Module: Legacy PPE Entry
# Purpose: Backward-compatible export of the new PPE engine app.

from __future__ import annotations

import sys
from pathlib import Path

_ROOT = Path(__file__).resolve().parents[3]
if str(_ROOT) not in sys.path:
	sys.path.insert(0, str(_ROOT))

from backend.ppe_engine.main import app
