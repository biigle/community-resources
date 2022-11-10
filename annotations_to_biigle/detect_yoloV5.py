import torch
import warnings
import os
from tqdm import tqdm
import imghdr

from biigle.biigle import Api
import export_to_biigle
from utils_pascalVOC import export_annotations_pascal

warnings.filterwarnings("ignore")


def model_inference(path_model, path_classes, path_data, export_biigle, mail=None, token=None, confidence=0.25,
                    label_tree_id=None, volume_id=None):
    """
    Apply a trained neural network model (yoloV5) on provided images. Can export created annotations directly to biigle
    or to a pascalVOC file
    :param path_model: path to yolo v5 trained model. An example is accessible here
    :param path_classes: txt file of the different classes possible
    :param path_data: path to image to infer directory
    :param export_biigle: boolean, export to Biigle if true
    :param mail: email for Biigle api
    :param token: token for Biigle api
    :param confidence: confidence level for detection
    :param label_tree_id: Biigle label tree id with the different classes from the classes.txt configuration file
    :param volume_id: Biigle volume id where images from path_data are
    """

    NMS_iou = 0.45
    shape = "Rectangle"  # Shape can be "Circle" or "Rectangle"

    model = torch.hub.load('ultralytics/yolov5', 'custom', path=path_model, device='cpu')  # Load the model

    model.conf = confidence
    model.iou = NMS_iou

    if export_biigle:
        api = Api(mail, token)
        label_idx = export_to_biigle.create_label_index(api, label_tree_id, path_classes)
        images_idx = export_to_biigle.create_image_index(api, volume_id)

    for image in tqdm(os.listdir(path_data)):  # for each image in the directory
        file_path = os.path.join(path_data, image)
        if os.path.isfile(file_path):  # Check if is image
            if imghdr.what(file_path) == "jpeg":  # Check image is jpeg image
                results = model(file_path)  # inference happens here

                annotations_xy = results.pandas().xyxy[0]  # Convert to panda table

                if len(annotations_xy) != 0:  # if features detected
                    height = results.ims[0].shape[0]
                    width = results.ims[0].shape[1]
                    # Save to pascalVOC file
                    pascalVOC_path = export_annotations_pascal(image, annotations_xy, width, height, path_data)

                    if export_biigle:
                        if label_tree_id is None or volume_id is None:
                            print("Error ! Missing argument...")
                        else:
                            export_to_biigle.pascalVOC_to_biigle(image, pascalVOC_path, label_idx, images_idx, shape,
                                                                 api)
