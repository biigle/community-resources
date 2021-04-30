# Create Volume

Create a new volume based on files found in a local directory.

**Important:** The local files are not uploaded to BIIGLE with this script. You still have to enter a (remote) volume URL where BIIGLE should look for the actual files.

## Installation

This script expects the [API wrapper script](/biigle) in a sibling directory (like in this repository). You can also replace the [biigle.py](biigle.py) link with the actual file.

This script expects an `.env` file with API credentials as described [here](/biigle#environment-variables).

## Usage

```
usage: create-volume.py [-h] [-m MEDIA_TYPE] project_id volume_url volume_name volume_dir

Create a new BIIGLE volume based on files of a local directory.

positional arguments:
  project_id            ID of the project to attach the new volume to.
  volume_url            URL of the new volume.
  volume_name           Name of the new volume.
  volume_dir            Local directory to extract the filenames from.

optional arguments:
  -h, --help            show this help message and exit
  -m MEDIA_TYPE, --media-type MEDIA_TYPE
                        Volume media type (image or video). Default: image
```
