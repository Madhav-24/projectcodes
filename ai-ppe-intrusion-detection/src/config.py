# Configuration settings for the AI-Based Far-Field Worker & PPE Intrusion Detection System

class Config:
    def __init__(self):
        # Model paths
        self.ppe_model_path = "path/to/ppe_model.pth"
        self.intrusion_model_path = "path/to/intrusion_model.pth"
        
        # Detection thresholds
        self.ppe_detection_threshold = 0.5
        self.intrusion_detection_threshold = 0.5
        
        # Input settings
        self.input_video_path = "data/raw/input_video.mp4"
        self.output_video_path = "data/processed/output_video.mp4"
        
        # Other parameters
        self.frame_width = 640
        self.frame_height = 480
        self.device = "cuda" if torch.cuda.is_available() else "cpu"