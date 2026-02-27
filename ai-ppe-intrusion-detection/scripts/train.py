import os
import yaml
import torch
import torchvision.transforms as transforms
from torch.utils.data import DataLoader
from src.datasets.loader import DataLoader as CustomDataLoader
from src.models.pytorch_model import PyTorchModel
from src.utils.dataset_utils import split_data
from src.utils.transforms import preprocess_image

def load_config(config_path):
    with open(config_path, 'r') as file:
        config = yaml.safe_load(file)
    return config

def train_model(config):
    # Load dataset
    dataset = CustomDataLoader(config['data']['path'])
    train_loader, val_loader = split_data(dataset, config['training']['split_ratio'])

    # Initialize model
    model = PyTorchModel(config['model'])
    model.train()

    # Define loss function and optimizer
    criterion = torch.nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=config['training']['learning_rate'])

    # Training loop
    for epoch in range(config['training']['num_epochs']):
        for images, labels in train_loader:
            images = preprocess_image(images)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

        print(f'Epoch [{epoch+1}/{config["training"]["num_epochs"]}], Loss: {loss.item():.4f}')

    # Save the trained model
    torch.save(model.state_dict(), config['model']['save_path'])

if __name__ == "__main__":
    config = load_config(os.path.join(os.path.dirname(__file__), '../configs/default.yaml'))
    train_model(config)