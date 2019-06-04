# Convert Laser Points

Create annotations from the positions of a laser point detection.

This can be useful if you want to review the laser point detections with the [Volume Label Review](https://biigle.de/manual/tutorials/annotations/navigating-images#volare) tool or have them included in reports.

## Installation

This script expects the [API wrapper script](/biigle) in a sibling directory (like in this repository). You can also replace the [biigle.py](biigle.py) link with the actual file.

## Usage

Set the following variables at the top of the script:

| Name | Description |
| --- | --- |
| `email` | The email address of the user who should be the creator of the laser point annotations |
| `token` | [API token](https://biigle.de/settings/tokens) of the user |
| `volume_id` | ID of the volume where the laser point annotations should be created. You can find the volume ID in the URL bar of your browser. Example: `https://biigle.de/volumes/464` is the volume with ID 464 |
| `label_id` | ID of the laser point label. You can find the ID of a label in the JSON output of the label tree API endpoint. Try `https://biigle.de/api/v1/label-trees/1` |

When all laser point detections have been converted to annotations, you can use the [Volume Label Review](https://biigle.de/manual/tutorials/annotations/navigating-images#volare) tool to review them. Afterward, you should re-run the laser point detection so the laser point and area information is updated for each image.
