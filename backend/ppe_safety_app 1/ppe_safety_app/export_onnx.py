#!/usr/bin/env python3
"""Export a trained YOLO model to ONNX format.

Input:
- Path to trained .pt model (CLI arg or PPE_TRAINED_MODEL_PATH env var)

Output:
- ONNX file at configured output path
"""

from __future__ import annotations

import argparse
import os
from pathlib import Path
import shutil

from ultralytics import YOLO


def _build_parser() -> argparse.ArgumentParser:
    """Create CLI parser for model export options.

    Returns:
    - Configured ArgumentParser instance.
    """
    parser = argparse.ArgumentParser(description="Export a trained YOLO model to ONNX")
    parser.add_argument(
        "--model",
        default=os.getenv("PPE_TRAINED_MODEL_PATH", "runs/detect/ppe_extended/weights/best.pt"),
        help="Path to trained .pt model",
    )
    parser.add_argument(
        "--output",
        default=os.getenv("PPE_ONNX_OUTPUT_PATH", "best.onnx"),
        help="Output ONNX file path",
    )
    parser.add_argument("--opset", type=int, default=12, help="ONNX opset version")
    parser.add_argument("--no-simplify", action="store_true", help="Disable ONNX graph simplification")
    return parser


def export_model_to_onnx(model_path: str, output_path: str, opset: int = 12, simplify: bool = True) -> Path:
    """Export a trained YOLO model to ONNX.

    Parameters:
    - model_path: Path to trained .pt file.
    - output_path: Destination path for ONNX file.
    - opset: ONNX opset version.
    - simplify: Whether to simplify the ONNX graph.

    Returns:
    - Absolute path to exported ONNX file.
    """
    model_file = Path(model_path).expanduser().resolve()
    if not model_file.exists():
        raise FileNotFoundError(f"Model not found: {model_file}")

    output_file = Path(output_path).expanduser().resolve()
    output_file.parent.mkdir(parents=True, exist_ok=True)

    print(f"Loading model from: {model_file}")
    model = YOLO(str(model_file))
    print(f"Model loaded successfully. Classes: {model.names}")

    print("Exporting to ONNX...")
    exported_path = model.export(format="onnx", simplify=simplify, opset=opset)

    shutil.copy(str(exported_path), str(output_file))
    print(f"ONNX exported to: {output_file}")
    print(f"Model classes: {list(model.names.values())}")
    return output_file


def main() -> None:
    """Parse CLI arguments and run ONNX export.

    Returns:
    - None
    """
    parser = _build_parser()
    args = parser.parse_args()

    export_model_to_onnx(
        model_path=args.model,
        output_path=args.output,
        opset=args.opset,
        simplify=not args.no_simplify,
    )


if __name__ == "__main__":
    main()
