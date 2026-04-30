from pathlib import Path
import shutil


# Target class schema used by ppe_extended_data.yaml
TARGET_NAMES = {
    0: "person",
    1: "helmet",
    2: "vest",
    3: "safety_shoes",
    4: "safety_gloves",
    5: "safety_harness",
}

# Source class IDs from Manoj_Harness_Dataset/data.yaml -> target class IDs
# Dropped classes: goggles, no-PPE classes, slippers
CLASS_MAP = {
    8: 0,   # Person -> person
    0: 1,   # Helmet -> helmet
    1: 2,   # Safety_Vest -> vest
    3: 3,   # Safety_shoes -> safety_shoes
    10: 5,  # Safety_Harness -> safety_harness
}

ROOT = Path(__file__).resolve().parent
SRC_ROOT = ROOT / "Manoj_Harness_Dataset"
DST_ROOT = ROOT / "dataset"

SPLIT_MAP = {
    "Train": "train",
    "Valid": "val",
    "Test": "val",  # Merge test into val for extra evaluation samples.
}

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tif", ".tiff"}


def reset_target_dirs():
    for split in {"train", "val"}:
        img_dir = DST_ROOT / "images" / split
        lbl_dir = DST_ROOT / "labels" / split
        img_dir.mkdir(parents=True, exist_ok=True)
        lbl_dir.mkdir(parents=True, exist_ok=True)

        for p in img_dir.glob("*"):
            if p.is_file():
                p.unlink()
        for p in lbl_dir.glob("*"):
            if p.is_file():
                p.unlink()


def remap_label_file(src_label: Path, dst_label: Path):
    out_lines = []
    if src_label.exists():
        for raw in src_label.read_text().splitlines():
            parts = raw.strip().split()
            if len(parts) != 5:
                continue
            try:
                src_id = int(parts[0])
            except ValueError:
                continue

            if src_id not in CLASS_MAP:
                continue

            dst_id = CLASS_MAP[src_id]
            out_lines.append(" ".join([str(dst_id), *parts[1:]]))

    dst_label.write_text("\n".join(out_lines) + ("\n" if out_lines else ""))


def copy_and_remap_split(src_split: str, dst_split: str):
    src_images = SRC_ROOT / src_split / "images"
    src_labels = SRC_ROOT / src_split / "labels"
    dst_images = DST_ROOT / "images" / dst_split
    dst_labels = DST_ROOT / "labels" / dst_split

    if not src_images.exists() or not src_labels.exists():
        raise FileNotFoundError(f"Missing expected folders in split {src_split}")

    count = 0
    for img_path in src_images.iterdir():
        if img_path.suffix.lower() not in IMAGE_EXTS or not img_path.is_file():
            continue

        out_stem = f"{src_split.lower()}_{img_path.stem}"
        dst_img = dst_images / f"{out_stem}{img_path.suffix.lower()}"
        dst_lbl = dst_labels / f"{out_stem}.txt"

        shutil.copy2(img_path, dst_img)
        remap_label_file(src_labels / f"{img_path.stem}.txt", dst_lbl)
        count += 1

    return count


def summarize_labels():
    counts = {k: 0 for k in TARGET_NAMES}
    per_split = {"train": 0, "val": 0}

    for split in per_split:
        lbl_dir = DST_ROOT / "labels" / split
        for label_path in lbl_dir.glob("*.txt"):
            per_split[split] += 1
            for raw in label_path.read_text().splitlines():
                parts = raw.strip().split()
                if len(parts) != 5:
                    continue
                try:
                    cid = int(parts[0])
                except ValueError:
                    continue
                if cid in counts:
                    counts[cid] += 1

    return per_split, counts


def main():
    if not SRC_ROOT.exists():
        raise FileNotFoundError(f"Source dataset not found: {SRC_ROOT}")

    reset_target_dirs()

    copied = {}
    for src_split, dst_split in SPLIT_MAP.items():
        copied[src_split] = copy_and_remap_split(src_split, dst_split)

    per_split, counts = summarize_labels()

    print("Remap complete.")
    print(f"Images copied by source split: {copied}")
    print(f"Label files by target split: {per_split}")
    print("Target class annotation counts:")
    for cid, name in TARGET_NAMES.items():
        print(f"  {cid} ({name}): {counts[cid]}")


if __name__ == "__main__":
    main()
