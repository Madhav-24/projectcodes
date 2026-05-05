import cv2
import torch
from config import Config
from detectors.ppe_detector import PPEDetector
from detectors.intrusion_detector import IntrusionDetector
from datasets.loader import DataLoader
from utils.visualization import visualize_detections

def main():
    # Load configuration (paths, thresholds, runtime settings).
    config = Config()

    # Initialize detectors.
    ppe_detector = PPEDetector(config.ppe_model_path)
    intrusion_detector = IntrusionDetector(config.intrusion_model_path)

    # Load data source (images/video frames).
    data_loader = DataLoader(config.data_path)

    for frame in data_loader:
        # Detect PPE on the current frame.
        ppe_detections = ppe_detector.detect(frame)

        # Classify detections into Worker/Intruder.
        intrusion_results = intrusion_detector.classify(ppe_detections)

        # Visualize results for quick inspection.
        visualize_detections(frame, ppe_detections, intrusion_results)

if __name__ == "__main__":
    main()