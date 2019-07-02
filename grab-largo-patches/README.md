# Grab Largo Patches

Download the Largo patches of annotations with a specific label.

## Installation

This script expects the [API wrapper script](/biigle) in a sibling directory (like in this repository). You can also replace the [biigle.py](biigle.py) link with the actual file.

## Usage

Set the following variables at the top of the script:

| Name | Description |
| --- | --- |
| `email` | Your email address. |
| `token` | Your [API token](https://biigle.de/settings/tokens). |
| `model_type` | Either `'project'` or `'volume'`, depending on if you want to download patches of all annotations of a project or a volume. |
| `model_id` | ID of the project/volume to download the Largo patches from. You can find the ID in the URL bar of your browser. Example: `https://biigle.de/volumes/464` is the volume with ID 464. |
| `label_id` | ID of the label to download the Largo patches for. You can find the ID of a label in the JSON output of the label tree API endpoint. Try [`https://biigle.de/api/v1/label-trees/1`](https://biigle.de/api/v1/label-trees/1) |

The script downloads the Largo patches into the current directory.
