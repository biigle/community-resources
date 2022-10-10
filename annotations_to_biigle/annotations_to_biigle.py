import detect_yoloV5
import utils_pascalVOC
import export_to_biigle
from biigle.biigle import Api

"""
Example usage of annotations to biigle functions
"""


# Biigle email and token
email = 'mmarcill@ifremer.fr'
token = 'jxSmYAj3uM7OOA1GIp5w2wCOyYMhb7vo'
label_tree_id = 1229  # Label tree id
volume_id = 7544  # Volume id where images are stored

path_model = r"D:\model\mbari-mb-benthic-33k.pt"  # Model from Fathomnet model zoo: https://zenodo.org/record/5539915
path_classes = r"D:\model\mbari-mb-benthic-33k.names"  # Corresponding name list from Fathomnet
path_data = r"D:\test_cs"  # Where to store downloaded images, or where image are stored
export_biigle = True  # Export to Biigle ?
confidence = 0.25  # Confidence Level for detection

api = Api(email, token)
utils_pascalVOC.download_images(api, volume_id, path_data)  # Download all images from the volume id

detect_yoloV5.model_inference(path_model, path_classes, path_data, export_biigle, email, token, confidence=confidence,
                              label_tree_id=label_tree_id, volume_id=volume_id)  # Do inference and export to biigle

# Export annotations from pascalVOC to Biigle.
images_idx = export_to_biigle.create_image_index(api, volume_id)
label_idx = export_to_biigle.create_label_index(api, label_tree_id, path_classes)
shape = "Rectangle"
image_name = ""
pascalVOC_path = ""

# export_to_biigle.pascalVOC_to_biigle(image_name, pascalVOC_path, label_idx, images_idx, shape, api)
