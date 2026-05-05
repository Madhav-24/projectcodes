"""
train_machinery.py - Train YOLOv11n on construction machinery dataset.

Classes: excavator, bulldozer, piling_rig, dump_truck

Usage:
    python scripts/train_machinery.py
    python scripts/train_machinery.py --epochs 250 --batch 8
    python scripts/train_machinery.py --resume

Trained weights will be saved to:
    runs/detect/runs/train/machinery_model/weights/best.pt
    runs/detect/runs/train/machinery_model/weights/last.pt
"""

import argparse
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

from ultralytics import YOLO

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DATA_YAML = os.path.join(ROOT, 'data', 'machinery', 'data.yaml')
PROJECT = os.path.join(ROOT, 'runs', 'detect', 'runs', 'train')
RUN_NAME = 'machinery_model'


def parse_args():
    parser = argparse.ArgumentParser(description='Train YOLOv11n machinery detector')
    parser.add_argument('--data', type=str, default=DATA_YAML)
    parser.add_argument('--model', type=str, default='yolo11n.pt')
    parser.add_argument('--epochs', type=int, default=250)
    parser.add_argument('--batch', type=int, default=8)
    parser.add_argument('--imgsz', type=int, default=640)
    parser.add_argument('--device', type=str, default='0', help='0 for GPU, cpu for CPU')
    parser.add_argument('--resume', action='store_true')
    parser.add_argument('--name', type=str, default=RUN_NAME)
    return parser.parse_args()


def main():
    args = parse_args()

    print('=' * 60)
    print('  YOLOv11n Machinery Training')
    print(f'  Base model : {args.model}')
    print(f'  Dataset    : {args.data}')
    print(f'  Epochs     : {args.epochs}')
    print(f'  Batch size : {args.batch}')
    print(f'  Device     : {args.device}')
    print('=' * 60)

    if args.resume:
        last_pt = os.path.join(PROJECT, args.name, 'weights', 'last.pt')
        if not os.path.exists(last_pt):
            print(f'[ERROR] No checkpoint to resume at: {last_pt}')
            sys.exit(1)
        model = YOLO(last_pt)
        print(f'[INFO] Resuming from {last_pt}')
        model.train(resume=True)
    else:
        model = YOLO(args.model)
        model.train(
            data=args.data,
            epochs=args.epochs,
            imgsz=args.imgsz,
            batch=args.batch,
            device=args.device,
            project=PROJECT,
            name=args.name,
            exist_ok=True,
            workers=0,
            patience=50,
            degrees=10.0,
            scale=0.5,
            shear=3.0,
            fliplr=0.5,
            flipud=0.1,
            mosaic=1.0,
            mixup=0.1,
            hsv_h=0.015,
            hsv_s=0.7,
            hsv_v=0.4,
        )

    best_pt = os.path.join(PROJECT, args.name, 'weights', 'best.pt')
    print('\n' + '=' * 60)
    print('  Training complete!')
    print(f'  Best weights : {best_pt}')
    print('\n  Wire into inference with:')
    print('  python scripts/infer.py --source images/samplevid3.mp4 \\')
    print(f'      --machinery-weights "{best_pt}" --save')
    print('=' * 60)


if __name__ == '__main__':
    main()
