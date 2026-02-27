import torch
from torchvision import transforms
from src.models.pytorch_model import PyTorchModel
from src.datasets.loader import DataLoader
from src.utils.visualization import visualize_detections
from src.config import Config

def evaluate_model(model, data_loader, device):
    model.eval()
    total_correct = 0
    total_samples = 0

    with torch.no_grad():
        for images, labels in data_loader:
            images = images.to(device)
            labels = labels.to(device)

            outputs = model(images)
            _, predicted = torch.max(outputs, 1)

            total_correct += (predicted == labels).sum().item()
            total_samples += labels.size(0)

    accuracy = total_correct / total_samples
    return accuracy

def main():
    config = Config()
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    model = PyTorchModel(config.model_path).to(device)
    data_loader = DataLoader(config.validation_data_path, batch_size=config.batch_size)

    accuracy = evaluate_model(model, data_loader, device)
    print(f'Model Accuracy: {accuracy * 100:.2f}%')

if __name__ == "__main__":
    main()