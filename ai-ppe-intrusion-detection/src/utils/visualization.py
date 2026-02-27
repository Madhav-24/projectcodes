from matplotlib import pyplot as plt
import cv2

def draw_bounding_boxes(image, boxes, labels, colors=None):
    for box, label in zip(boxes, labels):
        x1, y1, x2, y2 = box
        color = colors[label] if colors else (0, 255, 0)  # Default to green if no colors provided
        cv2.rectangle(image, (x1, y1), (x2, y2), color, 2)
        cv2.putText(image, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
    return image

def display_image(image, title='Image'):
    plt.imshow(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
    plt.title(title)
    plt.axis('off')
    plt.show()