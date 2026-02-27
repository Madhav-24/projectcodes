"""
train.py - Train YOLOv8 on the PPE / construction dataset.

Usage:
    python scripts/train.py
    python scripts/train.py --epochs 50 --batch 16
    python scripts/train.py --epochs 100 --batch 8 --model yolov8s.pt
    python scripts/train.py --resume   (resume last interrupted run)

Trained weights will be saved to:
    runs/detect/runs/train/ppe_model/weights/best.pt
    runs/detect/runs/train/ppe_model/weights/last.pt
"""

import argparse
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from ultralytics import YOLO

# ── Default paths ────────────────────────────────────────────────────────────
ROOT      = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DATA_YAML = os.path.join(ROOT, 'data', 'raw', 'data.yaml')
PROJECT   = os.path.join(ROOT, 'runs', 'detect', 'runs', 'train')
RUN_NAME  = 'ppe_model'


def parse_args():
    parser = argparse.ArgumentParser(description='Train YOLOv8 PPE detector')
    parser.add_argument('--data',    type=str,   default=DATA_YAML,  help='Path to data.yaml')
    parser.add_argument('--model',   type=str,   default='yolov8n.pt',
                        help='Base model: yolov8n.pt | yolov8s.pt | yolov8m.pt')
    parser.add_argument('--epochs',  type=int,   default=50,         help='Number of epochs')
    parser.add_argument('--batch',   type=int,   default=8,          help='Batch size')
    parser.add_argument('--imgsz',   type=int,   default=640,        help='Image size')
    parser.add_argument('--device',  type=str,   default='cpu',      help='cpu or 0 (GPU)')
    parser.add_argument('--resume',  action='store_true',            help='Resume last run')
    parser.add_argument('--name',    type=str,   default=RUN_NAME,   help='Run folder name')
    return parser.parse_args()


def main():
    args = parse_args()

    print("=" * 60)
    print(f"  YOLOv8 PPE Training")
    print(f"  Base model : {args.model}")
    print(f"  Dataset    : {args.data}")
    print(f"  Epochs     : {args.epochs}")
    print(f"  Batch size : {args.batch}")
    print(f"  Image size : {args.imgsz}")
    print(f"  Device     : {args.device}")
    print("=" * 60)

    if args.resume:
        last_pt = os.path.join(PROJECT, args.name, 'weights', 'last.pt')
        if not os.path.exists(last_pt):
            print(f"[ERROR] No checkpoint to resume at: {last_pt}")
            sys.exit(1)
        model = YOLO(last_pt)
        print(f"[INFO] Resuming from {last_pt}")
        model.train(resume=True)
    else:
        model = YOLO(args.model)
        model.train(
            data     = args.data,
            epochs   = args.epochs,
            imgsz    = args.imgsz,
            batch    = args.batch,
            device   = args.device,
            project  = PROJECT,
            name     = args.name,
            exist_ok = True,       # overwrite existing run folder
        )

    best_pt = os.path.join(PROJECT, args.name, 'weights', 'best.pt')
    print("\n" + "=" * 60)
    print(f"  Training complete!")
    print(f"  Best weights : {best_pt}")
    print(f"\n  Run inference with:")
    print(f"  python scripts/infer.py --source data/raw/test/images \\")
    print(f"      --weights \"{best_pt}\" --save --conf 0.35")
    print("=" * 60)


if __name__ == '__main__':
    main()