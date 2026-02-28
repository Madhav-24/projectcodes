"""
infer.py - Run PPE + Intrusion detection on an image, video file, or webcam.

Usage:
    python scripts/infer.py --source data/raw/test/images/sample.jpg
    python scripts/infer.py --source data/raw/test/images --save
    python scripts/infer.py --source path/to/video.mp4 --save
    python scripts/infer.py --source 0
    python scripts/infer.py --source data/raw/test/images --weights runs/train/best.pt
"""

import sys
import os
import argparse
import cv2

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.detectors.ppe_detector import PPEDetector
from src.detectors.intrusion_detector import IntrusionDetector
from src.utils.visualization import draw_detections, save_json_log

IMAGE_EXTS = {'.jpg', '.jpeg', '.png', '.bmp', '.tif', '.tiff'}
VIDEO_EXTS = {'.mp4', '.avi', '.mov', '.mkv', '.webm'}


def parse_args():
    parser = argparse.ArgumentParser(description='PPE & Intrusion Inference')
    parser.add_argument('--source',         type=str, required=True)
    parser.add_argument('--weights',        type=str, default='runs/detect/runs/train/ppe_model/weights/best.pt',
                        help='Custom PPE model weights')
    parser.add_argument('--person-weights', type=str, default='yolo11n.pt',
                        help='Pretrained YOLO weights for person detection (COCO, default: yolo11n.pt)')
    parser.add_argument('--person-conf', type=float, default=0.10,
                        help='Confidence threshold for person detection (lower = more recall)')
    parser.add_argument('--conf',    type=float, default=0.25)
    parser.add_argument('--iou',     type=float, default=0.45)
    parser.add_argument('--device',  type=str, default='cpu')
    parser.add_argument('--imgsz',   type=int, default=640)
    parser.add_argument('--save',    action='store_true')
    parser.add_argument('--log',     action='store_true')
    parser.add_argument('--no-show', action='store_true', dest='no_show',
                        help='Skip cv2.imshow; open saved image with default viewer instead')
    parser.add_argument('--no-helmet', action='store_false', dest='require_helmet')
    parser.add_argument('--no-vest',   action='store_false', dest='require_vest')
    parser.set_defaults(require_helmet=True, require_vest=False)
    return parser.parse_args()


def build_pipeline(args):
    detector = PPEDetector(
        weights=args.weights,
        person_weights=args.person_weights,  # pretrained COCO (large) for person detection
        conf_threshold=args.conf,
        person_conf=args.person_conf,        # lower threshold for max recall
        nms_threshold=args.iou,
        device=args.device,
        image_size=args.imgsz
    )
    return IntrusionDetector(
        ppe_detector=detector,
        require_helmet=args.require_helmet,
        require_vest=args.require_vest
    )


def run_on_image(path, classifier, args, out_dir, show=True):
    frame = cv2.imread(path)
    if frame is None:
        print(f"[ERROR] Cannot read image: {path}")
        return
    results   = classifier.process_frame(frame)
    annotated = draw_detections(frame, results)
    workers   = sum(1 for r in results if r['label'] == 'Worker')
    intruders = sum(1 for r in results if r['label'] == 'Intruder')
    print(f"[INFO] {os.path.basename(path):40s} | Persons: {len(results):2d} | Workers: {workers} | Intruders: {intruders}")
    if show:
        cv2.imshow('PPE Intrusion Detection  [Q to quit]', annotated)
        cv2.waitKey(0)
    if args.save:
        out_path = os.path.join(out_dir, 'img_' + os.path.basename(path))
        cv2.imwrite(out_path, annotated)
        print(f"[SAVED] {out_path}")
    if args.log:
        log_path = os.path.join(out_dir, os.path.splitext(os.path.basename(path))[0] + '.json')
        save_json_log(results, log_path)
        print(f"[LOG]   {log_path}")


def run_on_video(source, classifier, args, out_dir):
    cap_src = int(source) if str(source).isdigit() else source
    cap = cv2.VideoCapture(cap_src)
    if not cap.isOpened():
        print(f"[ERROR] Cannot open source: {source}")
        return
    w   = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h   = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    out_writer = None
    if args.save:
        out_name   = f"output_{os.path.basename(str(source))}" if not str(source).isdigit() else "output_webcam.mp4"
        out_path   = os.path.join(out_dir, out_name)
        fourcc     = cv2.VideoWriter_fourcc(*'mp4v')
        out_writer = cv2.VideoWriter(out_path, fourcc, fps, (w, h))
        print(f"[INFO] Saving video to {out_path}")
    frame_id = 0
    print("[INFO] Running inference. Press Q to quit.")
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        results   = classifier.process_frame(frame)
        annotated = draw_detections(frame, results)
        if out_writer:
            out_writer.write(annotated)
        if args.log:
            save_json_log(results, os.path.join(out_dir, f'frame_{frame_id:06d}.json'), frame_id)
        cv2.imshow('PPE Intrusion Detection  [Q to quit]', annotated)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
        frame_id += 1
    cap.release()
    if out_writer:
        out_writer.release()
    cv2.destroyAllWindows()
    print(f"[INFO] Done. Processed {frame_id} frames.")


def main():
    args    = parse_args()
    out_dir = os.path.join('data', 'processed', 'results')
    os.makedirs(out_dir, exist_ok=True)
    classifier = build_pipeline(args)
    source     = args.source
    ext        = os.path.splitext(source)[1].lower()
    if str(source).isdigit():
        run_on_video(source, classifier, args, out_dir)
    elif ext in IMAGE_EXTS:
        show = not args.no_show
        run_on_image(source, classifier, args, out_dir, show=show)
        if args.no_show and args.save:
            import subprocess
            out_path = os.path.join(out_dir, 'img_' + os.path.basename(source))
            if os.path.exists(out_path):
                subprocess.Popen(['explorer', out_path])
    elif ext in VIDEO_EXTS:
        run_on_video(source, classifier, args, out_dir)
    elif os.path.isdir(source):
        files = sorted([f for f in os.listdir(source) if os.path.splitext(f)[1].lower() in IMAGE_EXTS])
        print(f"[INFO] Found {len(files)} images in {source}")
        for fname in files:
            run_on_image(os.path.join(source, fname), classifier, args, out_dir, show=False)
        cv2.destroyAllWindows()
    else:
        print(f"[ERROR] Unrecognised source: {source}")


if __name__ == '__main__':
    main()
