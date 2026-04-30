#!/usr/bin/env python3
"""Quick ONNX export wrapper.

This script forwards to export_onnx.py so both scripts share one code path.
"""

from __future__ import annotations

from export_onnx import main


if __name__ == "__main__":
    main()
