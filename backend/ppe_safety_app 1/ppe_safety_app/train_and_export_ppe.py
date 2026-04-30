"""Train a PPE detection model and export it to ONNX.

Input:
- Dataset YAML path and training hyperparameters via CLI args.

Output:
- Trained weights under runs directory and exported ONNX model.
"""

from __future__ import annotations

import argparse
from pathlib import Path
import shutil

from ultralytics import YOLO


def _build_parser() -> argparse.ArgumentParser:
    """Create CLI parser for training and export options.

    Returns:
    - Configured ArgumentParser.
    """
    parser = argparse.ArgumentParser(description="Train PPE model and export ONNX")
    parser.add_argument("--base-model", default="yolov8n.pt", help="Base YOLO model")
    parser.add_argument("--data", default="ppe_extended_data.yaml", help="Dataset YAML file")
    parser.add_argument("--epochs", type=int, default=100, help="Number of training epochs")
    parser.add_argument("--imgsz", type=int, default=640, help="Training image size")
    parser.add_argument("--batch", type=int, default=16, help="Batch size")
    parser.add_argument("--project", default="runs", help="Output project directory")
    parser.add_argument("--name", default="ppe_extended", help="Training run name")
    parser.add_argument("--device", default="", help="Training device, e.g. cpu, 0, 0,1")
    parser.add_argument("--onnx-output", default="best.onnx", help="Final ONNX output path")
    parser.add_argument("--opset", type=int, default=12, help="ONNX opset version")
    return parser


def train_and_export(
    base_model: str,
    data_yaml: str,
    epochs: int,
    imgsz: int,
    batch: int,
    project: str,
    name: str,
    device: str,
    onnx_output: str,
    opset: int,
) -> Path:
    """Train YOLO model and export best weights to ONNX.

    Parameters:
    - base_model: Initial model checkpoint path.
    - data_yaml: Dataset configuration yaml path.
    - epochs: Number of training epochs.
    - imgsz: Training image resolution.
    - batch: Batch size for training.
    - project: Parent output directory.
    - name: Run name under project directory.
    - device: Device selector for training runtime.
    - onnx_output: Output file path for ONNX model.
    - opset: ONNX opset version.

    Returns:
    - Absolute path to generated ONNX file.
    """
    trainer = YOLO(base_model)

    train_kwargs = {
        "data": data_yaml,
        "epochs": epochs,
        "imgsz": imgsz,
        "batch": batch,
        "project": project,
        "name": name,
    }
    if device:
        train_kwargs["device"] = device

    trainer.train(**train_kwargs)

    best_pt = Path(project) / "detect" / name / "weights" / "best.pt"
    if not best_pt.exists():
        raise FileNotFoundError(f"Expected trained weights not found: {best_pt}")

    best_model = YOLO(str(best_pt))
    exported_path = best_model.export(format="onnx", simplify=True, opset=opset)

    final_output = Path(onnx_output).expanduser().resolve()
    final_output.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(str(exported_path), str(final_output))

    print(f"Training complete. ONNX exported to: {final_output}")
    return final_output


def main() -> None:
    """CLI entrypoint for training and ONNX export."""
    args = _build_parser().parse_args()
    train_and_export(
        base_model=args.base_model,
        data_yaml=args.data,
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,
        project=args.project,
        name=args.name,
        device=args.device,
        onnx_output=args.onnx_output,
        opset=args.opset,
    )


if __name__ == "__main__":
    main()
