# BIIGLE Community Scripts

A collection of community-maintained scripts that use the BIIGLE API.

## Available scripts

This is a list of all scripts that are currently available in this repository. Each script has a readme file with detailed information.

| Script                                           | Description                                                                                              |
|--------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| [`biigle`](biigle)                               | A thin wrapper of the BIIGLE API that can be used in custom Python scripts.                              |
| [`convert-laser-points`](convert-laser-points)   | Create annotations from the positions of a laser point detection.                                        |
| [`grab-largo-patches`](grab-largo-patches)       | Download the Largo patches of annotations with a specific label.                                         |
| [`regular-sampling-grid`](regular-sampling-grid) | Create annotations that form a regular grid for all images of a volume.                                  |
| [`create-volume`](create-volume)                 | Create a new volume based on files found in a local directory.                                           |
| [`check_coordinates`](check_coordinates)         | Parses a CSV image annotation report file and adjusts all annotation coordinates to be inside the image. |
| [`annotations_to_biigle`](annotations_to_biigle) | Import pascalVOC annotations to BIIGLE, automatic detection and import using yoloV5 models.              |

## Other resources

This is a list of other tools and resources that are developed by the BIIGLE community.

| Resource                                         | Description                                                                                              |
|--------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| [example](link)                               | A great example for an external resource.

## Add your script

Please read the [contributing guidelines](CONTRIBUTING.md) for more information on how to add your own custom scripts to this collection.

## Disclaimer

These scripts are community-maintained and *not* officially developed or supported by the BIIGLE developers. Although we review each new script when it is submitted, we do not guarantee that it works as you intended. Please read the readme of each script that you use carefully and review the script.
