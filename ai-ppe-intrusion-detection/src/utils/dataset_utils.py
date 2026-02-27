def split_dataset(dataset, train_ratio=0.8):
    """
    Splits the dataset into training and validation sets.

    Parameters:
    - dataset: The dataset to be split.
    - train_ratio: The ratio of the dataset to be used for training.

    Returns:
    - train_set: The training subset of the dataset.
    - val_set: The validation subset of the dataset.
    """
    train_size = int(len(dataset) * train_ratio)
    val_size = len(dataset) - train_size
    train_set, val_set = torch.utils.data.random_split(dataset, [train_size, val_size])
    return train_set, val_set


def load_data_from_directory(directory, transform=None):
    """
    Loads data from a specified directory.

    Parameters:
    - directory: The path to the directory containing the data.
    - transform: Optional transform to be applied on the data.

    Returns:
    - dataset: A dataset object containing the loaded data.
    """
    dataset = datasets.ImageFolder(root=directory, transform=transform)
    return dataset


def get_class_labels(dataset):
    """
    Retrieves class labels from the dataset.

    Parameters:
    - dataset: The dataset from which to retrieve class labels.

    Returns:
    - class_labels: A list of class labels.
    """
    class_labels = dataset.classes
    return class_labels