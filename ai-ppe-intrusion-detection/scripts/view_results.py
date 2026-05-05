"""
view_results.py - Slideshow viewer for saved inference results.

Controls:
  Any key   → next image
  Q / Esc   → quit
"""
import cv2
import glob
import os
import sys

RESULTS_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'processed', 'results')


def main():
    images = sorted(glob.glob(os.path.join(RESULTS_DIR, '*.jpg')) +
                    glob.glob(os.path.join(RESULTS_DIR, '*.png')))
    if not images:
        print(f"[ERROR] No images found in {RESULTS_DIR}")
        print("  Run inference first:  python scripts/infer.py --source data/ppe/test/images --save")
        sys.exit(1)

    print(f"[INFO] {len(images)} result images found.")
    print("  Any key = next image  |  Q / Esc = quit")

    win = 'PPE Detection Results  [any key=next | Q=quit]'
    cv2.namedWindow(win, cv2.WINDOW_NORMAL)
    cv2.resizeWindow(win, 1280, 720)

    for idx, path in enumerate(images):
        img = cv2.imread(path)
        if img is None:
            continue

        h, w = img.shape[:2]
        bar = f"  {idx+1}/{len(images)}   {os.path.basename(path)}"
        cv2.rectangle(img, (0, h - 28), (w, h), (30, 30, 30), -1)
        cv2.putText(img, bar, (6, h - 8), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (200, 200, 200), 1)

        cv2.imshow(win, img)

        # Poll until a real key is pressed or the window is closed
        while True:
            key = cv2.waitKey(100)   # 100 ms poll
            # Window closed via X button
            if cv2.getWindowProperty(win, cv2.WND_PROP_VISIBLE) < 1:
                key = 27
                break
            if key != -1:
                break

        if key in (ord('q'), ord('Q'), 27):   # Q or Esc → quit
            break
        # Any other key → next image

    cv2.destroyAllWindows()
    print("[INFO] Viewer closed.")


if __name__ == '__main__':
    main()

