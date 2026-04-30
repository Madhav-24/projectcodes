# Module: Time Utils
# Purpose: Provide realtime timestamp fields for alert payloads.

from __future__ import annotations

from datetime import datetime


def get_current_date_time() -> tuple[str, str]:
    now = datetime.now()
    return now.strftime("%Y-%m-%d"), now.strftime("%H:%M:%S")
