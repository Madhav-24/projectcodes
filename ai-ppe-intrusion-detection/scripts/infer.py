import cv2
import torch
import yaml
from src.models.pytorch_model import PyTorchModel
from src.detectors.ppe_detector import PPEDetector
from src.detectors.intrusion_detector import IntrusionDetector

def load_config(config_path):
    with open(config_path, 'r') as file:
        config = yaml.safe_load(file)
    return config

def main(video_source):
    config = load_config('configs/default.yaml')
    
    model = PyTorchModel(config['model'])
    ppe_detector = PPEDetector(model)
    intrusion_detector = IntrusionDetector(model)

    cap = cv2.VideoCapture(video_source)

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        ppe_detections = ppe_detector.detect(frame)
        intrusion_detections = intrusion_detector.classify(ppe_detections)

        # Visualization of results can be added here

        cv2.imshow('Inference', frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main(0)  # Change 0 to the video file path if needed