# Annotations_to_biigle

- Import pascalVOC annotations into Biigle.
- Automatic feature detection on Biigle images using yoloV5 models and annotations import back in Biigle via pascalVOC

## Installation

The script requires `pandas`, `pytorch`, `seaborn`, `pillow`, `tqdm`, `opencv`, `yaml`, `pascal-voc-writer`.
```bash
conda create --name annotations_to_biigle -y
conda activate annotations_to_biigle
conda install requests -y
conda install pytorch torchvision torchaudio cpuonly -c pytorch -y
conda install -c conda-forge pandas seaborn tqdm opencv -y
pip install pascal_voc_writer pyyaml
```

Alternatively, a conda environment can be installed through the `environment.yml` file.

Example yoloV5 detection model can be found on: [https://zenodo.org/record/5539915](https://zenodo.org/record/5539915)

## Usage

See the [`annotations_to_biigle`](annotations_to_biigle.py) file.

| Name            | Description                                                                                                                                       |
|-----------------|---------------------------------------------------------------------------------------------------------------------------------------------------|
| `email`         | Your email address.                                                                                                                               |
| `token`         | Your Biigle token.                                                                                                                                |
| `label_tree_id` | Your label tree id. This label tree MUST contain every classes possibly detected or annotated. Otherwise, a new label will automatically be added |
| `volume_id`     | The volume id where your images are located.                                                                                                      |
| `path_model`    | Path to your yoloV5 model.                                                                                                                        |
| `path_classes`  | Path to a file (.txt or .names) with ALL your classes (one class per row).                                                                        |
| `path_data`     | Path where to store downloaded images, or where image are located.                                                                                |
| `confidence`    | Confidence detection level.                                                                                                                       |
| `export_biigle` | Boolean, export to Biigle ?                                                                                                                       |

### Main functions

- `utils_pascalVOC.download_images` : Download all images from the volume id
- `detect_yoloV5.model_inference` : Do inference and export to biigle
- `export_to_biigle.pascalVOC_to_biigle` : Export annotations from pascalVOC to Biigle


