"""
infer.py - Run PPE + Intrusion detection on an image, video file, or webcam.

Usage:
    python scripts/infer.py --source data/ppe/test/images/sample.jpg
    python scripts/infer.py --source data/ppe/test/images --save
    python scripts/infer.py --source path/to/video.mp4 --save
    python scripts/infer.py --source 0
    python scripts/infer.py --source data/ppe/test/images --weights runs/train/best.pt
"""

import sys
import os
import csv
import json
import argparse
import webbrowser
import cv2
import numpy as np
from collections import Counter
from datetime import datetime

# Ensure project imports work when running from scripts/.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Always run from project root regardless of where VS Code launched from.
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

from src.detectors.ppe_detector import PPEDetector
from src.detectors.intrusion_detector import IntrusionDetector
from src.utils.activity_rules import detect_activity
from src.utils.road_layer_validator import classify_layer
from src.utils.visualization import draw_detections, save_json_log

IMAGE_EXTS = {'.jpg', '.jpeg', '.png', '.bmp', '.tif', '.tiff'}
VIDEO_EXTS = {'.mp4', '.avi', '.mov', '.mkv', '.webm'}


def parse_args():
    # CLI arguments for model weights, thresholds, and output options.
    parser = argparse.ArgumentParser(description='PPE & Intrusion Inference')
    parser.add_argument('--source',         type=str, required=False, default=None)
    parser.add_argument('--weights',        type=str, default='runs/detect/runs/train/ppe_model/weights/best.pt',
                        help='Custom PPE model weights')
    parser.add_argument('--person-weights', type=str, default='yolo11n.pt',
                        help='Pretrained YOLO weights for person detection (COCO, default: yolo11n.pt)')
    parser.add_argument('--person-conf', type=float, default=0.55,
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
    parser.add_argument('--tools-weights', type=str,
                        default='runs/detect/runs/train/tools_model/weights/best.pt',
                        help='Path to tools model weights (shovel/broom/asphalt_rake)')
    parser.add_argument('--tools-conf', type=float, default=0.10,
                        help='Confidence threshold for tool detection')
    parser.add_argument('--machinery-weights', type=str,
                        default='runs/detect/runs/train/machinery_model/weights/best.pt',
                        help='Path to machinery model weights (excavator/bulldozer/piling_rig/dump_truck)')
    parser.add_argument('--machinery-conf', type=float, default=0.30,
                        help='Confidence threshold for machinery detection')
    parser.add_argument('--road-layer-weights', type=str,
                        default='runs/segment/train/road_layer_seg_model/weights/best.pt',
                        help='Path to road-layer segmentation model weights')
    parser.add_argument('--road-layer-conf', type=float, default=0.25,
                        help='Confidence threshold for road-layer segmentation')
    return parser.parse_args()


def _open_dashboard(html_path: str) -> None:
    """Open dashboard HTML in default browser with a Windows fallback."""
    abs_path = os.path.abspath(html_path)
    file_url = f'file:///{abs_path.replace(os.sep, "/")}'
    opened = False
    try:
        opened = bool(webbrowser.open(file_url, new=2))
    except Exception:
        opened = False
    if not opened and os.name == 'nt':
        try:
            os.startfile(abs_path)
        except Exception:
            print(f"[WARN] Could not open dashboard automatically. Open manually: {abs_path}")


def build_pipeline(args):
    # Build PPE detector and wrap it with intrusion classification logic.
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


def run_on_image(path, classifier, args, out_dir, show=True, tools_model=None, machinery_model=None, road_layer_model=None):
    # Run full pipeline on a single image and emit a report/dashboard.
    frame = cv2.imread(path)
    if frame is None:
        print(f"[ERROR] Cannot read image: {path}")
        return

    # Tool detection disabled.
    tools_model = None
    if machinery_model is None:
        machinery_model = _load_machinery_model(args)
    if road_layer_model is None:
        road_layer_model = _load_road_layer_model(args)

    # PPE + intrusion classification.
    results = classifier.process_frame(frame)
    # Tool detection disabled.
    annotated = draw_detections(frame, results)
    # Run machinery + road-layer detection for context features.
    machinery_dets = _detect_machinery(machinery_model, frame, args.machinery_conf, args.device)
    _draw_machinery_boxes(annotated, machinery_dets)
    road_layer_summary = _detect_road_layer(road_layer_model, frame, args.road_layer_conf, args.device)
    _draw_road_layer_text(annotated, road_layer_summary)
    # Extract lightweight features for activity scoring and reporting.
    features = _extract_activity_features(frame)
    payload = _build_activity_frame_payload(machinery_dets, road_layer_summary, frame)
    payload['features'] = features
    frame_activity, activity_scores = detect_activity(payload)
    frame_activities = [frame_activity] if frame_activity else []
    workers   = sum(1 for r in results if r['label'] == 'Worker')
    intruders = sum(1 for r in results if r['label'] == 'Intruder')
    top_layer = road_layer_summary.get('top_layer', 'Unknown') if road_layer_summary else 'Unknown'
    activities_text = ', '.join(frame_activities) if frame_activities else 'none'
    print(f"[INFO] {os.path.basename(path):40s} | Persons: {len(results):2d} | Workers: {workers} | Intruders: {intruders} | Road layer: {top_layer} | Activities: {activities_text}")
    # Interactive preview window (optional).
    if show:
        WIN_IMG = 'PPE Intrusion Detection  [Q to quit]'
        cv2.namedWindow(WIN_IMG, cv2.WINDOW_NORMAL)
        # Scale window to fit within 90% of screen resolution
        ih, iw = annotated.shape[:2]
        max_w, max_h = int(cv2.getWindowProperty(WIN_IMG, cv2.WND_PROP_AUTOSIZE) or 1280), 720
        try:
            import ctypes
            user32 = ctypes.windll.user32
            max_w  = int(user32.GetSystemMetrics(0) * 0.90)
            max_h  = int(user32.GetSystemMetrics(1) * 0.90)
        except Exception:
            max_w, max_h = 1280, 720
        scale  = min(max_w / iw, max_h / ih, 1.0)
        win_w  = int(iw * scale)
        win_h  = int(ih * scale)
        cv2.resizeWindow(WIN_IMG, win_w, win_h)
        cv2.imshow(WIN_IMG, annotated)
        cv2.waitKey(0)
        try:
            cv2.destroyWindow(WIN_IMG)
        except cv2.error:
            # Window may already be closed by the user.
            pass
    # Persist outputs if requested.
    if args.save:
        out_path = os.path.join(out_dir, 'img_' + os.path.basename(path))
        cv2.imwrite(out_path, annotated)
        print(f"[SAVED] {out_path}")
    if args.log:
        log_path = os.path.join(out_dir, os.path.splitext(os.path.basename(path))[0] + '.json')
        save_json_log(results, log_path)
        print(f"[LOG]   {log_path}")

    # Build per-slot vote dicts from single frame.
    slot_role_votes = {}
    slot_ppe_votes  = {}
    slot_tool_votes = {}
    worker_slot = 0
    for r in results:
        if r['label'] == 'Worker':
            ppe  = r.get('ppe', {})
            role = ppe.get('role', 'Unknown')
            slot_role_votes[worker_slot] = Counter({role: 1})
            slot_ppe_votes[worker_slot]  = {
                'helmet': int(bool(ppe.get('helmet', False))),
                'vest':   int(bool(ppe.get('vest',   False))),
                'total':  1,
            }
            # Tool detection disabled
            worker_slot += 1

    # Build report dict for dashboard/HTML.
    h_img, w_img = frame.shape[:2]
    img_name = os.path.splitext(os.path.basename(path))[0]
    alert    = intruders > 0
    report = {
        'source':           os.path.basename(path),
        'generated_at':     datetime.now().isoformat(timespec='seconds'),
        'frames_processed': 1,
        'duration_s':       0,
        'fps':              0,
        'resolution':       f"{w_img}x{h_img}",
        'summary': {
            'peak_persons':       len(results),
            'peak_workers':       workers,
            'peak_intruders':     intruders,
            'alert':              alert,
            'intruder_frames':    int(alert),
            'intruder_frame_pct': 100.0 if alert else 0.0,
        },
        'ppe_compliance': {
            'total_worker_detections': workers,
            'helmet_worn_pct':   round(sum(1 for r in results if r['label']=='Worker' and r.get('ppe',{}).get('helmet')) * 100 / max(workers,1), 1),
            'vest_worn_pct':     round(sum(1 for r in results if r['label']=='Worker' and r.get('ppe',{}).get('vest'))   * 100 / max(workers,1), 1),
            'fully_equipped_pct':round(sum(1 for r in results if r['label']=='Worker' and r.get('ppe',{}).get('helmet') and r.get('ppe',{}).get('vest')) * 100 / max(workers,1), 1),
            'missing_ppe_pct':   0.0,
        },
        'intruder_events': [{'frame': 0, 'time_s': 0, 'count': intruders}] if alert else [],
        'timeline': [],
        'machinery_summary': {
            'detected_classes': sorted(list({d['name'] for d in machinery_dets})),
            'presence_pct': {name: 100.0 for name in sorted(list({d['name'] for d in machinery_dets}))},
            'peak_count_per_frame': dict(Counter(d['name'] for d in machinery_dets)),
        },
        'road_layer_summary': road_layer_summary,
        'features': features,
        'activities': frame_activities,
        'activity_scores': {k: round(v, 3) for k, v in activity_scores.items()},
    }
    html_path = _save_html_report(report, out_dir, img_name,
                                  slot_role_votes, slot_ppe_votes, slot_tool_votes,
                                  workers, intruders)
    _open_dashboard(html_path)


def _save_report(report: dict, out_dir: str, vid_name: str):
    """Save the detection report as a dashboard-ready JSON file."""
    json_path = os.path.join(out_dir, f'report_{vid_name}.json')
    with open(json_path, 'w') as f:
        json.dump(report, f, indent=2)
    print(f"[REPORT] Dashboard JSON saved -> {json_path}")
    return json_path


TOOL_TASK_MAP = {
    'asphalt_rake': 'Paving Worker',
    'shovel':       'Material Handling Worker',
    'broom':        'Surface Preparation Worker',
}


def _save_html_report(report: dict, out_dir: str, vid_name: str,
                      slot_role_votes: dict = None, slot_ppe_votes: dict = None,
                      slot_tool_votes: dict = None,
                      majority_workers: int = 0, majority_intruders: int = 0) -> str:
    """Generate a self-contained HTML report and return its path."""
    # Summary banner and alert styling.
    s   = report['summary']
    ppe = report['ppe_compliance']
    alert       = s['alert']
    banner_bg   = '#c0392b' if alert else '#27ae60'
    banner_txt  = '&#9888; ALERT: UNAUTHORISED PERSON(S) DETECTED ON SITE' if alert else '&#10003; Site is clear &mdash; No intruders detected'
    intruder_card_cls = 'card alert' if alert else 'card'

    # Intruder events table rows.
    events_rows = ''
    for ev in report.get('intruder_events', []):
        m, sec = divmod(int(ev['time_s']), 60)
        events_rows += f'<tr><td>{m:02d}:{sec:02d}</td><td>Frame {ev["frame"]:04d}</td><td>{ev["count"]}</td></tr>\n'

    # Build per-person PPE rows from majority vote data.
    person_rows = ''
    # Worker rows (from slot votes).
    for slot_idx in range(majority_workers):
        votes  = (slot_role_votes or {}).get(slot_idx, {})
        ppe_v  = (slot_ppe_votes  or {}).get(slot_idx, {'helmet': 0, 'vest': 0, 'total': 1})
        tvotes = (slot_tool_votes or {}).get(slot_idx, {})
        majority_role = max(votes,  key=votes.get)  if votes  else 'Unknown'
        majority_tool = max(tvotes, key=tvotes.get) if tvotes else None
        role_label    = majority_role if majority_role != 'Unknown' else '—'
        tool_label    = majority_tool if majority_tool else '—'
        task_label    = TOOL_TASK_MAP.get(majority_tool, '—') if majority_tool else '—'
        if task_label != '—':
            role_label = f'{role_label} ({task_label})' if role_label != '—' else task_label
        h_yn  = 'Yes' if ppe_v['helmet'] > ppe_v['total'] / 2 else 'No'
        v_yn  = 'Yes' if ppe_v['vest']   > ppe_v['total'] / 2 else 'No'
        h_cls = 'yes' if h_yn == 'Yes' else 'no'
        v_cls = 'yes' if v_yn == 'Yes' else 'no'
        person_rows += (
            f'<tr class="worker-row">'
            f'<td>Person {slot_idx + 1}</td>'
            f'<td>Worker</td>'
            f'<td>{role_label}</td>'
            f'<td>{tool_label}</td>'
            f'<td class="{h_cls}">{h_yn}</td>'
            f'<td class="{v_cls}">{v_yn}</td>'
            f'</tr>\n'
        )
    # Intruder rows.
    for i in range(majority_intruders):
        person_rows += (
            f'<tr class="intruder-row">'
            f'<td>Person {majority_workers + i + 1}</td>'
            f'<td>Intruder</td>'
            f'<td>—</td>'
            f'<td>—</td>'
            f'<td class="no">No</td>'
            f'<td class="no">No</td>'
            f'</tr>\n'
        )

    person_table = f'''
    <h2>Personnel PPE Status (Majority of Video)</h2>
    <table>
            <thead><tr><th>Person</th><th>Classification</th><th>Role</th><th>Tool Used</th><th>Helmet</th><th>Vest</th></tr></thead>
      <tbody>{person_rows}</tbody>
    </table>''' if (majority_workers + majority_intruders) > 0 else ''

    # Machinery summary table.
    machinery = report.get('machinery_summary', {})
    machinery_rows = ''
    for m_name in machinery.get('detected_classes', []):
        m_peak = machinery.get('peak_count_per_frame', {}).get(m_name, 0)
        m_pct  = machinery.get('presence_pct', {}).get(m_name, 0.0)
        machinery_rows += f'<tr><td>{m_name}</td><td>{m_peak}</td><td>{m_pct}%</td></tr>\n'

    machinery_table = f'''
    <h2>Machinery Detected</h2>
    <table>
    <thead><tr><th>Machine</th><th>Count</th><th>presence</th></tr></thead>
      <tbody>{machinery_rows}</tbody>
    </table>''' if machinery_rows else '<h2>Machinery Detected</h2><p>No machinery detected.</p>'

    # Road-layer summary and feature diagnostics.
    layer_summary = report.get('road_layer_summary', {}) or {}
    top_layer = layer_summary.get('top_layer', 'Unknown')
    top_conf = float(layer_summary.get('top_conf', 0.0))
    layer_rows = ''.join(
        f'<tr><td>{l.get("name", "Unknown")}</td><td>{float(l.get("avg_conf", 0.0)):.3f}</td><td>{float(l.get("area_pct", 0.0)):.2f}%</td></tr>\n'
        for l in layer_summary.get('layers', [])
    )
    layer_table = (
        f'<h2>Detected Layer</h2>'
        f'<p><strong>Top Layer:</strong> {top_layer} ({top_conf:.3f})</p>'
        f'<table><thead><tr><th>Layer</th><th>Avg Conf</th><th>Area %</th></tr></thead>'
        f'<tbody>{layer_rows}</tbody></table>'
        f'<p style="margin-top:10px; color:#444;">'
        f'<strong>Texture Variance:</strong> {report.get("features", {}).get("texture_variance", 0):.3f} '
        f'&nbsp;&nbsp;|&nbsp;&nbsp; '
        f'<strong>Edge Density:</strong> {report.get("features", {}).get("edge_density", 0):.3f}'
        f'</p>'
    ) if layer_rows else (
        f'<h2>Detected Layer</h2>'
        f'<p><strong>Top Layer:</strong> {top_layer} ({top_conf:.3f})</p>'
        f'<p style="margin-top:10px; color:#444;">'
        f'<strong>Texture Variance:</strong> {report.get("features", {}).get("texture_variance", 0):.3f} '
        f'&nbsp;&nbsp;|&nbsp;&nbsp; '
        f'<strong>Edge Density:</strong> {report.get("features", {}).get("edge_density", 0):.3f}'
        f'</p>'
    )

    # Activities and scores.
    activity_items = report.get('activities', []) or []
    activity_rows = ''.join(f'<tr><td>{a.replace("_", " ")}</td></tr>\n' for a in activity_items)
    primary_activity = activity_items[0].replace('_', ' ') if activity_items else 'no activity detected'
    activity_table = (
        f'<h2>Detected Activities</h2>'
        f'<table><thead><tr><th>Activity</th></tr></thead>'
        f'<tbody>{activity_rows}</tbody></table>'
    ) if activity_items else '<h2>Detected Activities</h2><p>No activity matched the rules.</p>'

    activity_scores = report.get('activity_scores', {}) or {}
    score_rows = ''.join(
        f'<tr><td>{name.replace("_", " ")}</td><td>{score:.3f}</td></tr>\n'
        for name, score in sorted(activity_scores.items(), key=lambda x: x[1], reverse=True)
    )
    activity_score_table = (
        f'<h2>Activity Scores</h2>'
        f'<table><thead><tr><th>Activity</th><th>Score</th></tr></thead>'
        f'<tbody>{score_rows}</tbody></table>'
    ) if score_rows else '<h2>Activity Scores</h2><p>No activity scores available.</p>'

    # Render HTML report document.
    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PPE Detection Report &mdash; {report["source"]}</title>
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{ font-family: "Segoe UI", Arial, sans-serif; background: #f0f2f5; color: #222; }}
    header {{ background: #1a1a2e; color: #fff; padding: 28px 40px; }}
    header h1 {{ font-size: 1.6rem; font-weight: 700; }}
    header p  {{ font-size: 0.9rem; opacity: 0.7; margin-top: 4px; }}
    .banner {{
      background: {banner_bg}; color: #fff;
      text-align: center; padding: 18px; font-size: 1.2rem; font-weight: 700;
    }}
        .activity-hero {{
            margin: 24px 40px 0;
            padding: 24px 28px;
            border-radius: 12px;
            background: linear-gradient(135deg, #ffd54f 0%, #ffb300 100%);
            color: #1a1a1a;
            text-align: center;
            font-size: 2rem;
            font-weight: 800;
            letter-spacing: 1px;
            text-transform: lowercase;
            box-shadow: 0 10px 20px rgba(0, 0, 0, .14);
        }}
    .cards {{ display: flex; gap: 20px; padding: 32px 40px; flex-wrap: wrap; }}
    .card {{
      background: #fff; border-radius: 10px; padding: 28px 32px;
      flex: 1 1 160px; box-shadow: 0 2px 8px rgba(0,0,0,.08); text-align: center;
    }}
    .card .num {{ font-size: 3rem; font-weight: 800; color: #1a1a2e; }}
    .card .lbl {{ font-size: 0.95rem; color: #666; margin-top: 6px; }}
    .card.alert .num {{ color: #c0392b; }}
    .card.yes .num {{ color: #27ae60; }}
    .card.no  .num {{ color: #c0392b; }}
    .yes {{ color: #27ae60; font-weight: 600; }}
    .no  {{ color: #c0392b; font-weight: 600; }}
    .worker-row td:first-child {{ border-left: 3px solid #27ae60; }}
    .intruder-row td:first-child {{ border-left: 3px solid #c0392b; }}
    section {{ padding: 0 40px 40px; }}
    h2 {{ font-size: 1.1rem; color: #1a1a2e; margin-bottom: 14px; }}
    table {{ width: 100%; border-collapse: collapse; background: #fff;
             border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.08); }}
    th {{ background: #1a1a2e; color: #fff; padding: 12px 16px; text-align: left; font-size: 0.9rem; }}
    td {{ padding: 10px 16px; border-bottom: 1px solid #eee; font-size: 0.9rem; }}
    tr:last-child td {{ border-bottom: none; }}
    tr:nth-child(even) td {{ background: #f9f9f9; }}
    footer {{ text-align: center; padding: 24px; color: #999; font-size: 0.8rem; }}
  </style>
</head>
<body>
  <header>
    <h1>PPE &amp; Intrusion Detection Report</h1>
    <p>{report["source"]} &nbsp;&bull;&nbsp; {report["generated_at"]} &nbsp;&bull;&nbsp; {report["resolution"]} &nbsp;&bull;&nbsp; {report["duration_s"]}s @ {report["fps"]:.0f} fps</p>
  </header>
  <div class="banner">{banner_txt}</div>
    <div class="activity-hero">{primary_activity}</div>
        <div class="cards">
        <div class="card">
            <div class="num">{s["peak_persons"]}</div>
            <div class="lbl">Total People</div>
        </div>
        <div class="card">
            <div class="num">{s["peak_workers"]}</div>
            <div class="lbl">Workers</div>
        </div>
        <div class="{intruder_card_cls}">
            <div class="num">{s["peak_intruders"]}</div>
            <div class="lbl">Intruders</div>
        </div>
    </div>
  <section>{person_table}</section>
    <section>{machinery_table}</section>
                <section>{layer_table}</section>
        <section>{activity_table}</section>
        <section>{activity_score_table}</section>
  <footer>Generated by AI PPE Intrusion Detection System &mdash; {report["generated_at"]}</footer>
</body>
</html>'''

    html_path = os.path.join(out_dir, f'report_{vid_name}.html')
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"[REPORT] HTML report saved  -> {html_path}")
    return html_path


def _load_tools_model(args):
    """Load tools YOLO model if weights exist, else return None."""
    from ultralytics import YOLO
    if os.path.exists(args.tools_weights):
        print(f"[INFO] Tools model loaded: {args.tools_weights}")
        return YOLO(args.tools_weights)
    print(f"[INFO] No tools model found at {args.tools_weights} — tool detection disabled.")
    return None


def _load_machinery_model(args):
    """Load machinery YOLO model if weights exist, else return None."""
    from ultralytics import YOLO
    if os.path.exists(args.machinery_weights):
        print(f"[INFO] Machinery model loaded: {args.machinery_weights}")
        return YOLO(args.machinery_weights)
    print(f"[INFO] No machinery model found at {args.machinery_weights} — machinery detection disabled.")
    return None


def _load_road_layer_model(args):
    """Load road-layer segmentation model if weights exist, else return None."""
    from ultralytics import YOLO
    if os.path.exists(args.road_layer_weights):
        print(f"[INFO] Road-layer model loaded: {args.road_layer_weights}")
        return YOLO(args.road_layer_weights)
    print(f"[INFO] No road-layer model found at {args.road_layer_weights} — road-layer detection disabled.")
    return None


def _detect_tool(tools_model, frame, bbox, conf_threshold, device):
    """Crop person bbox from frame and run tools model.
    Returns (tool_name, tool_bbox_in_frame) or (None, None)."""
    if tools_model is None:
        return None, None
    fh, fw = frame.shape[:2]
    px1, py1, px2, py2 = bbox
    # Pad the crop by 40% so tools held at arm's length / below waist are included
    pad_x = int((px2 - px1) * 0.40)
    pad_y = int((py2 - py1) * 0.40)
    cx1 = max(0, px1 - pad_x)
    cy1 = max(0, py1 - pad_y)
    cx2 = min(fw, px2 + pad_x)
    cy2 = min(fh, py2 + pad_y)
    crop = frame[cy1:cy2, cx1:cx2]
    if crop.size == 0:
        return None, None
    res = tools_model.predict(source=crop, conf=conf_threshold, device=device, verbose=False)
    if not res or not res[0].boxes:
        return None, None
    boxes = res[0].boxes
    best_idx  = int(boxes.conf.argmax())
    class_id  = int(boxes.cls[best_idx])
    tool_name = tools_model.names[class_id]
    # translate crop-relative bbox back to frame coordinates
    tx1, ty1, tx2, ty2 = boxes.xyxy[best_idx].cpu().numpy().astype(int)
    tool_bbox = (cx1 + tx1, cy1 + ty1, cx1 + tx2, cy1 + ty2)
    return tool_name, tool_bbox


def _detect_machinery(machinery_model, frame, conf_threshold, device):
    """Run machinery model on full frame and return detections list."""
    if machinery_model is None:
        return []
    res = machinery_model.predict(source=frame, conf=conf_threshold, device=device, verbose=False)
    if not res or not res[0].boxes:
        return []
    dets = []
    boxes = res[0].boxes

    def _normalize_machinery_name(name: str) -> str:
        key = str(name).strip().lower().replace(' ', '_')
        alias_map = {
            'bull_dozer': 'Bulldozer',
            'bulldozer': 'Bulldozer',
        }
        return alias_map.get(key, str(name))

    for i in range(len(boxes)):
        class_id = int(boxes.cls[i])
        conf     = float(boxes.conf[i])
        x1, y1, x2, y2 = boxes.xyxy[i].cpu().numpy().astype(int)
        dets.append({
            'name': _normalize_machinery_name(machinery_model.names[class_id]),
            'confidence': conf,
            'bbox': (x1, y1, x2, y2),
        })
    return dets


def _extract_activity_features(frame):
    """Compute lightweight frame features for score-based activity logic."""
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 75, 150)
    edge_density = float(np.count_nonzero(edges)) / float(max(edges.size, 1))
    texture_variance = float(np.var(gray) / (255.0 * 255.0))

    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    # Green-ish hue band ratio as simple vegetation/context cue.
    green_mask = cv2.inRange(hsv, (35, 30, 30), (90, 255, 255))
    green_ratio = float(np.count_nonzero(green_mask)) / float(max(green_mask.size, 1))
    return {
        'edge_density': edge_density,
        'texture_variance': texture_variance,
        'green_ratio': green_ratio,
    }


def _build_activity_frame_payload(machinery_dets, road_layer_summary, frame):
    machinaries = []
    object_conf = {}
    positions = {}
    for d in machinery_dets:
        name = str(d.get('name', '')).strip()
        if not name:
            continue
        lname = name.lower()
        machinaries.append(lname)
        object_conf[lname] = max(float(d.get('confidence', 0.0)), object_conf.get(lname, 0.0))
        if lname not in positions:
            positions[lname] = tuple(d.get('bbox', (0, 0, 0, 0)))

    return {
        'machinaries': machinaries,
        'object_conf': object_conf,
        'layer': road_layer_summary.get('top_layer', 'Unknown') if road_layer_summary else 'Unknown',
        'layer_conf': float(road_layer_summary.get('top_conf', 0.0)) if road_layer_summary else 0.0,
        'features': _extract_activity_features(frame),
        'positions': positions,
    }


def _draw_machinery_boxes(frame, machinery_dets):
    """Draw machinery detections on the annotated frame."""
    color = (255, 80, 0)
    for d in machinery_dets:
        x1, y1, x2, y2 = d['bbox']
        name = d['name']
        conf = d['confidence']
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
        text = f"{name} {conf:.2f}"
        (tw, th), _ = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 2)
        cv2.rectangle(frame, (x1, y1 - th - 8), (x1 + tw + 6, y1), color, -1)
        cv2.putText(frame, text, (x1 + 3, y1 - 4),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2)


def _detect_road_layer(road_layer_model, frame, conf_threshold, device):
    """Run road-layer segmentation and summarize dominant layer."""
    if road_layer_model is None:
        return {'top_layer': 'Unknown', 'top_conf': 0.0, 'layers': []}

    res = road_layer_model.predict(source=frame, conf=conf_threshold, device=device, verbose=False)
    if not res or len(res) == 0:
        return {'top_layer': 'Unknown', 'top_conf': 0.0, 'layers': []}

    pred = res[0]
    if pred.boxes is None or len(pred.boxes) == 0:
        return {'top_layer': 'Unknown', 'top_conf': 0.0, 'layers': []}

    masks = pred.masks.data if pred.masks is not None else None
    h, w = frame.shape[:2]
    img_area = float(max(h * w, 1))

    layer_stats = {}
    if isinstance(road_layer_model.names, dict):
        candidate_layers = [str(v).lower() for _, v in sorted(road_layer_model.names.items())]
    else:
        candidate_layers = [str(v).lower() for v in road_layer_model.names]

    for i in range(len(pred.boxes)):
        cls_id = int(pred.boxes.cls[i])
        model_conf = float(pred.boxes.conf[i])
        pred_name = str(road_layer_model.names.get(cls_id, cls_id)).lower()
        x1, y1, x2, y2 = pred.boxes.xyxy[i].cpu().numpy().astype(int)

        final_name, final_score = classify_layer(
            {
                'bbox': (x1, y1, x2, y2),
                'class': pred_name,
                'confidence': model_conf,
            },
            frame,
            possible_layers=candidate_layers,
        )

        area_px = 0.0
        if masks is not None and i < len(masks):
            area_px = float(np.count_nonzero(masks[i].cpu().numpy() > 0.5))

        if final_name not in layer_stats:
            layer_stats[final_name] = {'frames': 0, 'conf_sum': 0.0, 'area_px': 0.0}
        layer_stats[final_name]['frames'] += 1
        layer_stats[final_name]['conf_sum'] += final_score
        layer_stats[final_name]['area_px'] += area_px

    layers = []
    for name, st in layer_stats.items():
        avg_conf = st['conf_sum'] / max(st['frames'], 1)
        area_pct = (st['area_px'] * 100.0) / img_area
        layers.append({
            'name': name,
            'frames': int(st['frames']),
            'avg_conf': round(avg_conf, 3),
            'area_pct': round(area_pct, 2),
        })

    layers.sort(key=lambda x: (x['area_pct'], x['avg_conf']), reverse=True)
    top = layers[0] if layers else {'name': 'Unknown', 'avg_conf': 0.0}
    return {
        'top_layer': top['name'],
        'top_conf': float(top['avg_conf']),
        'layers': layers,
    }


def _draw_road_layer_text(frame, road_layer_summary):
    """Draw the dominant road-layer label on the frame."""
    if not road_layer_summary:
        return
    top_layer = road_layer_summary.get('top_layer', 'Unknown')
    top_conf = float(road_layer_summary.get('top_conf', 0.0))
    if top_layer == 'Unknown':
        return

    text = f"Road layer: {top_layer} ({top_conf:.2f})"
    x, y = 12, 30
    (tw, th), _ = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.7, 2)
    cv2.rectangle(frame, (x - 6, y - th - 8), (x + tw + 8, y + 6), (0, 120, 255), -1)
    cv2.putText(frame, text, (x, y), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)


def run_on_video(source, classifier, args, out_dir):
    cap_src = int(source) if str(source).isdigit() else source
    cap = cv2.VideoCapture(cap_src)
    tools_model = _load_tools_model(args)
    machinery_model = _load_machinery_model(args)
    road_layer_model = _load_road_layer_model(args)
    if not cap.isOpened():
        print(f"[ERROR] Cannot open source: {source}")
        return
    w   = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h   = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    vid_name = os.path.splitext(os.path.basename(str(source)))[0] if not str(source).isdigit() else 'webcam'

    out_writer = None
    if args.save:
        out_name   = f"output_{os.path.basename(str(source))}" if not str(source).isdigit() else "output_webcam.mp4"
        out_path   = os.path.join(out_dir, out_name)
        fourcc     = cv2.VideoWriter_fourcc(*'mp4v')
        out_writer = cv2.VideoWriter(out_path, fourcc, fps, (w, h))
        print(f"[INFO] Saving video to {out_path}")

    # Per-frame accumulators
    frame_id        = 0
    peak_persons    = 0
    peak_workers    = 0
    peak_intruders  = 0
    intruder_frames = 0
    w_total = w_helmet = w_vest = w_both = 0
    timeline         = []
    intruder_events  = []
    count_to_results = {}   # person_count -> last results with that count
    # role / ppe / tool vote tracking per worker slot
    slot_role_votes  = {}   # slot_idx -> Counter({'Yellow': 40, 'Blue': 10, ...})
    slot_ppe_votes   = {}   # slot_idx -> {'helmet': int, 'vest': int, 'total': int}
    slot_tool_votes  = {}   # slot_idx -> Counter({'shovel': 30, 'broom': 5, ...})
    mach_presence_frames = Counter()   # class -> number of frames where class appeared
    mach_peak_counts     = Counter()   # class -> max count seen in any frame
    road_presence_frames = Counter()   # layer -> number of frames where layer was top
    road_conf_sum        = Counter()   # layer -> summed top confidence
    activity_presence_frames = Counter()  # activity -> number of frames where activity matched
    activity_score_sum = Counter()  # activity -> summed per-frame score
    # Accumulators for image-level features used in activity scoring
    sum_edge_density = 0.0
    sum_texture_variance = 0.0

    WIN = 'PPE Intrusion Detection  [Q to quit]'
    cv2.namedWindow(WIN, cv2.WINDOW_NORMAL)
    cv2.setWindowProperty(WIN, cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)

    print("[INFO] Running inference. Press Q to quit.")
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        results   = classifier.process_frame(frame)
        # Detect tools held by each person
        for r in results:
            bbox = r['person']['bbox']
            r['tool'], r['tool_bbox'] = _detect_tool(tools_model, frame, bbox,
                                                      args.tools_conf, args.device)
        annotated = draw_detections(frame, results)
        machinery_dets = _detect_machinery(machinery_model, frame, args.machinery_conf, args.device)
        _draw_machinery_boxes(annotated, machinery_dets)
        road_layer_summary = _detect_road_layer(road_layer_model, frame, args.road_layer_conf, args.device)
        _draw_road_layer_text(annotated, road_layer_summary)

        frame_top_layer = road_layer_summary.get('top_layer', 'Unknown')
        frame_top_conf = float(road_layer_summary.get('top_conf', 0.0))
        if frame_top_layer != 'Unknown':
            road_presence_frames[frame_top_layer] += 1
            road_conf_sum[frame_top_layer] += frame_top_conf

        # extract features and include them in activity payload
        features = _extract_activity_features(frame)
        sum_edge_density += float(features.get('edge_density', 0.0))
        sum_texture_variance += float(features.get('texture_variance', 0.0))
        payload = _build_activity_frame_payload(machinery_dets, road_layer_summary, frame)
        payload['features'] = features
        frame_activity, activity_scores = detect_activity(payload)
        frame_activities = [frame_activity] if frame_activity else []
        for activity_name in frame_activities:
            activity_presence_frames[activity_name] += 1
        for score_name, score_val in activity_scores.items():
            activity_score_sum[score_name] += float(score_val)

        frame_mach_counts = Counter(d['name'] for d in machinery_dets)
        for m_name, m_count in frame_mach_counts.items():
            mach_presence_frames[m_name] += 1
            mach_peak_counts[m_name] = max(mach_peak_counts[m_name], m_count)

        workers_now   = sum(1 for r in results if r['label'] == 'Worker')
        intruders_now = sum(1 for r in results if r['label'] == 'Intruder')
        ts = round(frame_id / fps, 2)

        # PPE compliance counters (workers only)
        worker_slot = 0
        intruder_slot = 0
        for r in results:
            if r['label'] == 'Worker':
                ppe = r.get('ppe', {})
                w_total  += 1
                w_helmet += int(bool(ppe.get('helmet', False)))
                w_vest   += int(bool(ppe.get('vest',   False)))
                w_both   += int(bool(ppe.get('helmet', False)) and bool(ppe.get('vest', False)))
                # Vote for this worker slot's role and PPE
                role = ppe.get('role', 'Unknown')
                if worker_slot not in slot_role_votes:
                    slot_role_votes[worker_slot] = Counter()
                    slot_ppe_votes[worker_slot]  = {'helmet': 0, 'vest': 0, 'total': 0}
                slot_role_votes[worker_slot][role] += 1
                slot_ppe_votes[worker_slot]['helmet'] += int(bool(ppe.get('helmet', False)))
                slot_ppe_votes[worker_slot]['vest']   += int(bool(ppe.get('vest',   False)))
                slot_ppe_votes[worker_slot]['total']  += 1
                # Tool vote
                tool = r.get('tool')
                if tool:
                    if worker_slot not in slot_tool_votes:
                        slot_tool_votes[worker_slot] = Counter()
                    slot_tool_votes[worker_slot][tool] += 1
                worker_slot += 1

        peak_workers   = max(peak_workers,   workers_now)
        peak_intruders = max(peak_intruders, intruders_now)
        if len(results) > peak_persons:
            peak_persons = len(results)
        count_to_results[len(results)] = results  # keep latest frame with this count
        if intruders_now > 0:
            intruder_frames += 1
            intruder_events.append({'frame': frame_id, 'time_s': ts, 'count': intruders_now})

        timeline.append({'frame': frame_id, 'time_s': ts,
                         'persons': len(results), 'workers': workers_now, 'intruders': intruders_now,
                         'activities': frame_activities,
                         'activity_scores': {k: round(v, 3) for k, v in activity_scores.items()}})

        if out_writer:
            out_writer.write(annotated)
        if args.log:
            save_json_log(results, os.path.join(out_dir, f'frame_{frame_id:06d}.json'), frame_id)
        cv2.imshow(WIN, annotated)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
        frame_id += 1

    cap.release()
    if out_writer:
        out_writer.release()
    cv2.destroyAllWindows()
    print(f"[INFO] Done. Processed {frame_id} frames.")

    # ── Majority-frame counts (only count N if seen in >50% of frames) ────────
    total_frames = max(frame_id, 1)
    threshold    = total_frames / 2

    def majority_count(key):
        """Largest N where timeline has >= N for that key in >50% of frames."""
        n = 0
        while sum(1 for t in timeline if t[key] >= n + 1) > threshold:
            n += 1
        return n

    majority_persons   = majority_count('persons')
    majority_workers   = majority_count('workers')
    majority_intruders = majority_count('intruders')

    # ── Build & save dashboard JSON ───────────────────────────────────────────
    intruder_pct = round(intruder_frames * 100 / max(frame_id, 1), 1)
    report = {
        'source':           os.path.basename(str(source)),
        'generated_at':     datetime.now().isoformat(timespec='seconds'),
        'frames_processed': frame_id,
        'duration_s':       round(frame_id / fps, 1),
        'fps':              round(fps, 2),
        'resolution':       f"{w}x{h}",
        'summary': {
            'peak_persons':        majority_persons,
            'peak_workers':        majority_workers,
            'peak_intruders':      majority_intruders,
            'alert':               majority_intruders > 0,
            'intruder_frames':     intruder_frames,
            'intruder_frame_pct':  intruder_pct,
        },
        'ppe_compliance': {
            'total_worker_detections': w_total,
            'helmet_worn_pct':   round(w_helmet * 100 / max(w_total, 1), 1),
            'vest_worn_pct':     round(w_vest   * 100 / max(w_total, 1), 1),
            'fully_equipped_pct':round(w_both   * 100 / max(w_total, 1), 1),
            'missing_ppe_pct':   round((w_total - w_both) * 100 / max(w_total, 1), 1),
        },
        'intruder_events': intruder_events,
        'timeline':        timeline,
        'machinery_summary': {
            'detected_classes': sorted(list(mach_presence_frames.keys())),
            'presence_pct': {k: round(mach_presence_frames[k] * 100 / max(frame_id, 1), 1) for k in mach_presence_frames},
            'peak_count_per_frame': dict(mach_peak_counts),
        },
        'road_layer_summary': {
            'top_layer': max(road_presence_frames, key=road_presence_frames.get) if road_presence_frames else 'Unknown',
            'top_conf': round((road_conf_sum[max(road_presence_frames, key=road_presence_frames.get)] / max(road_presence_frames[max(road_presence_frames, key=road_presence_frames.get)], 1)), 3) if road_presence_frames else 0.0,
            'layers': [
                {
                    'name': k,
                    'frames': int(road_presence_frames[k]),
                    'avg_conf': round(road_conf_sum[k] / max(road_presence_frames[k], 1), 3),
                    'area_pct': round(road_presence_frames[k] * 100 / max(frame_id, 1), 2),
                }
                for k in sorted(road_presence_frames.keys(), key=lambda x: road_presence_frames[x], reverse=True)
            ],
        },
        'features': {
            'edge_density': round(sum_edge_density / max(frame_id, 1), 6),
            'texture_variance': round(sum_texture_variance / max(frame_id, 1), 6),
        },
        'activities': sorted(list(activity_presence_frames.keys())),
        'activity_summary': {
            'detected_activities': sorted(list(activity_presence_frames.keys())),
            'presence_pct': {k: round(activity_presence_frames[k] * 100 / max(frame_id, 1), 1) for k in activity_presence_frames},
        },
        'activity_scores': {k: round(activity_score_sum[k] / max(frame_id, 1), 3) for k in activity_score_sum},
    }
    json_path  = _save_report(report, out_dir, vid_name)
    html_path  = _save_html_report(report, out_dir, vid_name,
                                   slot_role_votes, slot_ppe_votes, slot_tool_votes,
                                   majority_workers, majority_intruders)
    _open_dashboard(html_path)

    # ── Print simple report to terminal ──────────────────────────────────────
    div = '=' * 50
    print(f"\n{div}")
    print(f"  DETECTION REPORT  |  {report['source']}")
    print(div)
    print(f"  Total people       : {majority_persons}")
    print(f"  Workers detected   : {majority_workers}")
    print(f"  Intruders detected : {majority_intruders}")
    print(f"  Helmets detected   : {w_helmet}")
    print(f"  Vests detected     : {w_vest}")
    print(div)
    if peak_intruders > 0:
        print(f"  !! ALERT: UNAUTHORISED PERSON(S) DETECTED ON SITE !!")
    else:
        print(f"  Site is clear. No intruders detected.")
    print(f"{div}\n")


def main():
    args    = parse_args()
    # If no --source given (e.g. running directly from VS Code), ask interactively
    if not args.source:
        print('============================================')
        print('  AI PPE & Intrusion Detection System')
        print('============================================')
        vid = input('Enter file name : ').strip()
        args.source = f'images/{vid}'
        args.save   = True
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
