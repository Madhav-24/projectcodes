"""
train_tools.py - Train YOLOv11n on the construction tools dataset.

Classes: asphalt_rake, broom, shovel

Usage:
    python scripts/train_tools.py
    python scripts/train_tools.py --epochs 100 --batch 16
    python scripts/train_tools.py --resume

Trained weights will be saved to:
    runs/detect/runs/train/tools_model/weights/best.pt
    runs/detect/runs/train/tools_model/weights/last.pt
"""

import argparse
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

from ultralytics import YOLO

ROOT      = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DATA_YAML = os.path.join(ROOT, 'data', 'tools', 'data.yaml')
PROJECT   = os.path.join(ROOT, 'runs', 'detect', 'runs', 'train')
RUN_NAME  = 'tools_model'


def parse_args():
    parser = argparse.ArgumentParser(description='Train YOLOv11n construction tools detector')
    parser.add_argument('--data',    type=str, default=DATA_YAML)
    parser.add_argument('--model',   type=str, default='yolo11n.pt')
    parser.add_argument('--epochs',  type=int, default=300)
    parser.add_argument('--batch',   type=int, default=8)
    parser.add_argument('--imgsz',   type=int, default=640)
    parser.add_argument('--device',  type=str, default='0', help='0 for GPU, cpu for CPU')
    parser.add_argument('--resume',  action='store_true')
    parser.add_argument('--name',    type=str, default=RUN_NAME)
    return parser.parse_args()


def main():
    args = parse_args()

    print("=" * 60)
    print(f"  YOLOv11n Tools Training")
    print(f"  Base model : {args.model}")
    print(f"  Dataset    : {args.data}")
    print(f"  Epochs     : {args.epochs}")
    print(f"  Batch size : {args.batch}")
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
            data       = args.data,
            epochs     = args.epochs,
            imgsz      = args.imgsz,
            batch      = args.batch,
            device     = args.device,
            project    = PROJECT,
            name       = args.name,
            exist_ok   = True,
            workers    = 0,      # avoids Windows paging file issues
            patience   = 50,     # early stop if no improvement for 50 epochs
            # --- augmentation (critical for small 186-image dataset) ---
            degrees    = 15.0,   # rotate ±15°
            scale      = 0.6,    # scale ±60%
            shear      = 5.0,    # shear ±5°
            flipud     = 0.3,    # vertical flip 30%
            fliplr     = 0.5,    # horizontal flip 50%
            mosaic     = 1.0,    # mosaic augmentation
            mixup      = 0.15,   # mix two images
            hsv_h      = 0.02,   # hue shift
            hsv_s      = 0.8,    # saturation
            hsv_v      = 0.5,    # brightness
            copy_paste = 0.1,    # copy-paste augmentation
        )

    best_pt = os.path.join(PROJECT, args.name, 'weights', 'best.pt')
    print("\n" + "=" * 60)
    print(f"  Training complete!")
    print(f"  Best weights : {best_pt}")
    print(f"\n  Wire into inference with:")
    print(f"  python scripts/infer.py --source images/samplevid3.mp4 \\")
    print(f"      --tools-weights \"{best_pt}\" --save")
    print("=" * 60)


if __name__ == '__main__':
    main()
