import unittest
from src.detectors.ppe_detector import PPEDetector

class TestPPEDetector(unittest.TestCase):

    def setUp(self):
        self.detector = PPEDetector()

    def test_detect_helmet(self):
        # Test detection of helmet in an image
        image = "path/to/test/image_with_helmet.jpg"
        result = self.detector.detect(image)
        self.assertIn("helmet", result)

    def test_detect_vest(self):
        # Test detection of vest in an image
        image = "path/to/test/image_with_vest.jpg"
        result = self.detector.detect(image)
        self.assertIn("vest", result)

    def test_no_ppe(self):
        # Test detection when no PPE is present
        image = "path/to/test/image_without_ppe.jpg"
        result = self.detector.detect(image)
        self.assertNotIn("helmet", result)
        self.assertNotIn("vest", result)

if __name__ == '__main__':
    unittest.main()