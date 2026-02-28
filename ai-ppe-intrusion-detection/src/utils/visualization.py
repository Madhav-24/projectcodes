import cv2
import numpy as np
import json
from datetime import datetime
from matplotlib import pyplot as plt


# Colour palette
COLOR_WORKER   = (0, 200, 0)       # green
COLOR_INTRUDER = (0, 0, 220)       # red
COLOR_HELMET   = (0, 220, 100)     # teal-green
COLOR_VEST     = (0, 180, 255)     # orange
COLOR_MISSING  = (0, 0, 200)       # red for missing PPE text
COLOR_TEXT_BG  = (30, 30, 30)      # dark background for text


def draw_detections(frame: np.ndarray, results: list[dict]) -> np.ndarray:
    """
    Annotate a frame with bounding boxes, PPE status and Worker/Intruder labels.

    Args:
        frame:   BGR numpy array.
        results: Output from IntrusionDetector.process_frame()

    Returns:
        Annotated copy of the frame.
    """
    out = frame.copy()

    for r in results:
        person  = r['person']
        label   = r['label']
        ppe     = r['ppe']

        x1, y1, x2, y2 = person['bbox']
        conf = person['confidence']

        color = COLOR_WORKER if label == 'Worker' else COLOR_INTRUDER

        # Bounding box
        cv2.rectangle(out, (x1, y1), (x2, y2), color, 2)

        # Top label bar
        top_text = f"{label}  {conf:.2f}"
        (tw, th), _ = cv2.getTextSize(top_text, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
        cv2.rectangle(out, (x1, y1 - th - 8), (x1 + tw + 6, y1), color, -1)
        cv2.putText(out, top_text, (x1 + 3, y1 - 4),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

        # PPE status tags
        tag_y = y2 + 16
        vest_src = ppe.get('vest_source')
        vest_label = 'Vest(HSV)' if vest_src == 'color' else 'Vest'
        for item, present in [('Helmet', ppe['helmet']), (vest_label, ppe['vest'])]:
            icon      = '[OK]' if present else '[X]'
            base_name = 'Vest' if 'Vest' in item else item
            color_tag = (COLOR_HELMET if base_name == 'Helmet' else COLOR_VEST) if present else COLOR_MISSING
            cv2.putText(out, f"{icon} {item}", (x1, tag_y),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, color_tag, 2)
            tag_y += 18

    # Frame-level stats overlay
    workers   = sum(1 for r in results if r['label'] == 'Worker')
    intruders = sum(1 for r in results if r['label'] == 'Intruder')
    for i, (line, color) in enumerate([
        (f"Persons : {len(results)}", (200, 200, 200)),
        (f"Workers : {workers}",      COLOR_WORKER),
        (f"Intruders: {intruders}",   COLOR_INTRUDER),
    ]):
        y = 22 + i * 22
        cv2.rectangle(out, (8, y - 16), (175, y + 4), COLOR_TEXT_BG, -1)
        cv2.putText(out, line, (10, y), cv2.FONT_HERSHEY_SIMPLEX, 0.55, color, 2)

    return out


def draw_bounding_boxes(image: np.ndarray, boxes, labels, colors=None) -> np.ndarray:
    """Legacy helper — draw raw boxes with labels."""
    for box, label in zip(boxes, labels):
        x1, y1, x2, y2 = box
        color = colors[label] if colors else (0, 255, 0)
        cv2.rectangle(image, (x1, y1), (x2, y2), color, 2)
        cv2.putText(image, label, (x1, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
    return image


def display_image(image: np.ndarray, title: str = 'Image') -> None:
    """Display image using matplotlib (for notebooks / debug)."""
    plt.imshow(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
    plt.title(title)
    plt.axis('off')
    plt.show()


def save_json_log(results: list[dict], output_path: str, frame_id: int = 0) -> dict:
    """
    Save detection results as a JSON log entry.

    Args:
        results:     Output from IntrusionDetector.process_frame()
        output_path: Path to write the JSON file.
        frame_id:    Frame number (for video logs).
    """
    log = {
        'timestamp': datetime.now().isoformat(),
        'frame_id':  frame_id,
        'persons':   []
    }
    for r in results:
        log['persons'].append({
            'bbox':        r['person']['bbox'],
            'confidence':  r['person']['confidence'],
            'label':       r['label'],
            'helmet':      r['ppe']['helmet'],
            'vest':        r['ppe']['vest'],
            'missing_ppe': r.get('missing_ppe', [])
        })
    with open(output_path, 'w') as f:
        json.dump(log, f, indent=2)
    return log
