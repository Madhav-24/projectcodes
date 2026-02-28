import sys, os, cv2, glob
sys.path.insert(0, os.path.dirname(__file__))
from src.detectors.ppe_detector import PPEDetector

det = PPEDetector(
    weights='runs/detect/runs/train/ppe_model/weights/best.pt',
    person_weights='yolo11n.pt',
    conf_threshold=0.20,   # lower to catch vests
    person_conf=0.15,
    device='0'
)

imgs = sorted(glob.glob('data/raw/test/images/*.jpg'))[:5]
for p in imgs:
    frame = cv2.imread(p)
    persons    = det.detect_persons(frame)
    detections = det.detect(frame)
    ppe        = det.get_ppe(detections)
    print(f"{os.path.basename(p):40s} | persons={len(persons)} ppe_items={len(ppe)}")
    for d in detections:
        name = d['class_name']
        conf = d['confidence']
        bbox = d['bbox']
        print(f"  {name:10s} conf={conf:.2f}  bbox={bbox}")
    for person in persons:
        status = det.check_ppe_for_person(person, ppe)
        print(f"  -> Person bbox={person['bbox']}  ppe_status={status}")
