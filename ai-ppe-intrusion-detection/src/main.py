import cv2
import torch
from config import Config
from detectors.ppe_detector import PPEDetector
from detectors.intrusion_detector import IntrusionDetector
from datasets.loader import DataLoader
from utils.visualization import visualize_detections

def main():
    # Load configuration
    config = Config()

    # Initialize detectors
    ppe_detector = PPEDetector(config.ppe_model_path)
    intrusion_detector = IntrusionDetector(config.intrusion_model_path)

    # Load data
    data_loader = DataLoader(config.data_path)

    for frame in data_loader:
        # Detect PPE
        ppe_detections = ppe_detector.detect(frame)

        # Classify detections
        intrusion_results = intrusion_detector.classify(ppe_detections)

        # Visualize results
        visualize_detections(frame, ppe_detections, intrusion_results)

if __name__ == "__main__":
    main()