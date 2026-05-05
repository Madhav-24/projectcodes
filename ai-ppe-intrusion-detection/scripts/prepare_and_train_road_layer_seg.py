"""
prepare_and_train_road_layer_seg.py

Converts semantic segmentation masks from data/road_layer into YOLO segmentation
polygon labels, writes a YOLO-seg dataset under data/road_layer_yolo_seg, and
starts Ultralytics training.

Expected source layout:
    data/road_layer/
        train/*.jpg + *_mask.png
        valid/*.jpg + *_mask.png
        test/*.jpg + *_mask.png

Usage:
    python scripts/prepare_and_train_road_layer_seg.py
    python scripts/prepare_and_train_road_layer_seg.py --epochs 120 --batch 8 --device 0
"""

import argparse
import csv
import os
import shutil
import sys
from pathlib import Path

import cv2
import yaml
from ultralytics import YOLO


ROOT = Path(__file__).resolve().parents[1]
SRC_ROOT = ROOT / "data" / "road_layer"
OUT_ROOT = ROOT / "data" / "road_layer_yolo_seg"
PROJECT = ROOT / "runs" / "segment" / "train"
RUN_NAME = "road_layer_seg_model"


def parse_args():
    parser = argparse.ArgumentParser(description="Prepare and train road-layer YOLO segmentation")
    parser.add_argument("--source", type=Path, default=SRC_ROOT)
    parser.add_argument("--out", type=Path, default=OUT_ROOT)
    parser.add_argument("--model", type=str, default="yolo11n-seg.pt")
    parser.add_argument("--epochs", type=int, default=120)
    parser.add_argument("--batch", type=int, default=8)
    parser.add_argument("--imgsz", type=int, default=640)
    parser.add_argument("--device", type=str, default="0", help="0 for GPU, cpu for CPU")
    parser.add_argument("--name", type=str, default=RUN_NAME)
    parser.add_argument("--min-area", type=float, default=20.0, help="Min contour area to keep")
    parser.add_argument("--skip-prepare", action="store_true", help="Skip conversion and only train")
    return parser.parse_args()


def load_class_map(source_root: Path):
    classes_csv = source_root / "train" / "_classes.csv"
    if not classes_csv.exists():
        raise FileNotFoundError(f"Missing class file: {classes_csv}")

    pairs = []
    with classes_csv.open("r", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            pixel_value = int(row["Pixel Value"].strip())
            class_name = row[" Class"].strip() if " Class" in row else row["Class"].strip()
            pairs.append((pixel_value, class_name))

    pairs.sort(key=lambda x: x[0])
    if pairs[0][0] != 0:
        raise ValueError("Expected background class at pixel value 0")

    # YOLO class IDs start at 0, so map non-background pixel ids to 0..N-1
    pixel_to_yolo = {}
    names = []
    for pixel, name in pairs:
        if pixel == 0:
            continue
        pixel_to_yolo[pixel] = len(names)
        names.append(name)

    return pixel_to_yolo, names


def ensure_dirs(out_root: Path):
    for split in ("train", "valid", "test"):
        (out_root / "images" / split).mkdir(parents=True, exist_ok=True)
        (out_root / "labels" / split).mkdir(parents=True, exist_ok=True)


def contour_to_line(yolo_cls: int, contour, w: int, h: int):
    pts = contour.reshape(-1, 2)
    if pts.shape[0] < 3:
        return None

    coords = []
    for x, y in pts:
        xn = min(max(float(x) / float(w), 0.0), 1.0)
        yn = min(max(float(y) / float(h), 0.0), 1.0)
        coords.extend([xn, yn])

    if len(coords) < 6:
        return None

    return "{} {}".format(yolo_cls, " ".join(f"{v:.6f}" for v in coords))


def convert_split(source_root: Path, out_root: Path, split: str, pixel_to_yolo: dict, min_area: float):
    src_dir = source_root / split
    out_img_dir = out_root / "images" / split
    out_lbl_dir = out_root / "labels" / split

    images = sorted(src_dir.glob("*.jpg"))
    if not images:
        raise RuntimeError(f"No images found in {src_dir}")

    for img_path in images:
        stem = img_path.stem
        mask_path = src_dir / f"{stem}_mask.png"
        if not mask_path.exists():
            raise RuntimeError(f"Missing mask for image: {img_path.name}")

        dst_img = out_img_dir / img_path.name
        shutil.copy2(img_path, dst_img)

        # Some palette PNGs may still load with channels in OpenCV builds.
        mask = cv2.imread(str(mask_path), cv2.IMREAD_UNCHANGED)
        if mask is None:
            raise RuntimeError(f"Failed reading mask: {mask_path}")

        if len(mask.shape) == 3:
            mask = mask[:, :, 0]

        h, w = mask.shape
        lines = []

        for pixel_val, yolo_cls in pixel_to_yolo.items():
            binary = (mask == pixel_val).astype("uint8") * 255
            if binary.max() == 0:
                continue

            contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            for cnt in contours:
                area = cv2.contourArea(cnt)
                if area < min_area:
                    continue

                epsilon = 0.002 * cv2.arcLength(cnt, True)
                approx = cv2.approxPolyDP(cnt, epsilon, True)
                line = contour_to_line(yolo_cls, approx, w, h)
                if line:
                    lines.append(line)

        label_path = out_lbl_dir / f"{stem}.txt"
        with label_path.open("w", encoding="utf-8") as f:
            f.write("\n".join(lines))


def write_dataset_yaml(out_root: Path, names):
    data = {
        "path": str(out_root),
        "train": "images/train",
        "val": "images/valid",
        "test": "images/test",
        "names": names,
        "nc": len(names),
    }
    yaml_path = out_root / "data.yaml"
    with yaml_path.open("w", encoding="utf-8") as f:
        yaml.safe_dump(data, f, sort_keys=False)
    return yaml_path


def train(args, data_yaml: Path):
    model = YOLO(args.model)
    model.train(
        data=str(data_yaml),
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,
        device=args.device,
        project=str(PROJECT),
        name=args.name,
        exist_ok=True,
        workers=0,
        patience=40,
        degrees=5.0,
        scale=0.4,
        fliplr=0.5,
        flipud=0.1,
        mosaic=0.5,
        hsv_h=0.015,
        hsv_s=0.7,
        hsv_v=0.4,
    )


def main():
    args = parse_args()

    os.chdir(ROOT)
    sys.path.insert(0, str(ROOT))

    print("=" * 60)
    print("Road-layer segmentation prep + training")
    print(f"Source : {args.source}")
    print(f"Output : {args.out}")
    print(f"Model  : {args.model}")
    print(f"Epochs : {args.epochs}")
    print(f"Batch  : {args.batch}")
    print(f"Device : {args.device}")
    print("=" * 60)

    if not args.skip_prepare:
        pixel_to_yolo, names = load_class_map(args.source)
        ensure_dirs(args.out)
        for split in ("train", "valid", "test"):
            convert_split(args.source, args.out, split, pixel_to_yolo, args.min_area)
        data_yaml = write_dataset_yaml(args.out, names)
        print(f"[INFO] Prepared YOLO-seg dataset at: {args.out}")
        print(f"[INFO] Dataset YAML: {data_yaml}")
    else:
        data_yaml = args.out / "data.yaml"
        if not data_yaml.exists():
            raise FileNotFoundError(f"Missing data yaml: {data_yaml}")

    train(args, data_yaml)

    best_pt = PROJECT / args.name / "weights" / "best.pt"
    print("\n" + "=" * 60)
    print("Training complete")
    print(f"Best weights: {best_pt}")
    print("=" * 60)


if __name__ == "__main__":
    main()
