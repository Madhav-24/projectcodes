import unittest
from src.detectors.intrusion_detector import IntrusionDetector

class TestIntrusionDetector(unittest.TestCase):

    def setUp(self):
        self.detector = IntrusionDetector()

    def test_initialization(self):
        self.assertIsNotNone(self.detector)

    def test_detect_workers(self):
        # Assuming we have a method to simulate detection
        result = self.detector.detect_workers("path/to/test/image.jpg")
        self.assertIsInstance(result, list)  # Expecting a list of detected workers

    def test_detect_intruders(self):
        result = self.detector.detect_intruders("path/to/test/image.jpg")
        self.assertIsInstance(result, list)  # Expecting a list of detected intruders

    def test_ppe_compliance(self):
        result = self.detector.check_ppe_compliance("path/to/test/image.jpg")
        self.assertIn(result, ["compliant", "non-compliant"])  # Expecting compliance status

if __name__ == '__main__':
    unittest.main()