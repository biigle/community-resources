# BIIGLE Community Resources

A collection of community-maintained resources for [BIIGLE](https://biigle.de).

## Available scripts

This is a list of scripts using the BIIGLE API that are currently available in this repository. Each script has a readme file with detailed information.

| Script                                           | Description                                                                                              |
|--------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| [`biigle`](biigle)                               | A thin wrapper of the BIIGLE API that can be used in custom Python scripts.                              |
| [`convert-laser-points`](convert-laser-points)   | Create annotations from the positions of a laser point detection.                                        |
| [`grab-largo-patches`](grab-largo-patches)       | Download the Largo patches of annotations with a specific label.                                         |
| [`regular-sampling-grid`](regular-sampling-grid) | Create annotations that form a regular grid for all images of a volume.                                  |
| [`create-volume`](create-volume)                 | Create a new volume based on files found in a local directory.                                           |
| [`check_coordinates`](check_coordinates)         | Parses a CSV image annotation report file and adjusts all annotation coordinates to be inside the image. |
| [`annotations_to_biigle`](annotations_to_biigle) | Import pascalVOC annotations to BIIGLE, automatic detection and import using yoloV5 models.              |

### Add your script

Please read the [contributing guidelines](CONTRIBUTING.md) for more information on how to add your own custom scripts to this collection.

## Other resources

This is a list of other tools and resources that are developed by the BIIGLE community.

| Resource                                         | Description                                                                                              |
|--------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| [An ecologist's guide to BIIGLE](https://doi.org/10.5281/zenodo.7728926) | A document created by the [Deep Sea Conservation Research Unit](https://deepseacru.org) that is intended to help ecologists get started using BIIGLE to annotate their image and video data. |
| [Chubacapp](https://github.com/marinmarcillat/CHUBACAPP) | Toolbox to process images, 3D models and annotation data from ROV and AUV. YoloV5 inference to BIIGLE, annotations reprojection, 3D topographic metrics, disjoint image selection and more. Still under active development, feedback welcomed. |
| [DeepSeaCRU Resources](https://github.com/DeepSeaCRU/BIIGLE-resources) | Various resources by the [Deep Sea Conservation Research Unit](https://deepseacru.org) to interact with BIIGLE |

## Disclaimer

These scripts and resources are community-maintained and *not* officially developed or supported by the BIIGLE developers. Although we review each new script when it is submitted to this repository, we do not guarantee that it works as you intended. Please read the readme of each script that you use carefully and review the script.
