# AI-Based Far-Field Worker & PPE Intrusion Detection System

This project implements an AI-based system for detecting personal protective equipment (PPE) compliance and identifying potential intrusions in work environments using computer vision techniques. The system leverages OpenCV for image processing and PyTorch for deep learning model inference.

## Project Structure

```
ai-ppe-intrusion-detection
├── src                     # Source code for the application
│   ├── __init__.py
│   ├── main.py             # Entry point of the application
│   ├── config.py           # Configuration settings
│   ├── detectors            # Detection algorithms
│   │   ├── __init__.py
│   │   ├── ppe_detector.py  # PPE detection logic
│   │   └── intrusion_detector.py  # Intrusion detection logic
│   ├── models              # Model definitions
│   │   ├── __init__.py
│   │   └── pytorch_model.py # PyTorch model handling
│   ├── datasets            # Data loading and preprocessing
│   │   ├── __init__.py
│   │   └── loader.py       # Data loading utilities
│   └── utils               # Utility functions
│       ├── __init__.py
│       ├── dataset_utils.py # Dataset handling utilities
│       ├── transforms.py    # Image preprocessing functions
│       └── visualization.py  # Visualization functions
├── configs                 # Configuration files
│   └── default.yaml        # Default configuration settings
├── scripts                 # Scripts for training, inference, and evaluation
│   ├── train.py            # Model training script
│   ├── infer.py            # Inference script
│   └── evaluate.py         # Evaluation script
├── data                    # Data directories
│   ├── raw                 # Raw input data
│   └── processed           # Processed data
├── notebooks               # Jupyter notebooks for exploration
│   └── exploration.ipynb    # Exploratory data analysis
├── tests                   # Unit tests
│   ├── test_ppe_detector.py # Tests for PPE detector
│   └── test_intrusion_detector.py # Tests for intrusion detector
├── requirements.txt        # Required Python packages
├── setup.py                # Project setup script
├── .gitignore              # Files to ignore in version control
└── README.md               # Project documentation
```

## Installation

To set up the project, clone the repository and install the required dependencies:

```bash
git clone <repository-url>
cd ai-ppe-intrusion-detection
pip install -r requirements.txt
```

## Usage

1. **Training the Model**: Use the `train.py` script to train the model on your dataset.
   ```bash
   python scripts/train.py
   ```

2. **Running Inference**: Use the `infer.py` script to run inference on new images or videos.
   ```bash
   python scripts/infer.py --input <input_file> --output <output_file>
   ```

3. **Evaluating the Model**: Use the `evaluate.py` script to evaluate the model's performance on validation data.
   ```bash
   python scripts/evaluate.py --data <validation_data>
   ```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.