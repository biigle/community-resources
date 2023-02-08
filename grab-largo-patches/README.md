# Grab Largo Patches

Download the Largo patches of annotations (with specific label). The script can either be downloaded and run as a jupyter notebook or directly opened in Google colab

<a target="_blank" href="https://colab.research.google.com/github/biigle/community-scripts/blob/master/grab-largo-patches/grab-largo-patches.ipynb">
  <img src="https://colab.research.google.com/assets/colab-badge.svg" alt="Open In Colab"/>
</a>

## Usage

Set the following variables at the top of the script:

| Name | Description |
| --- | --- |
| `email` | Your email address. |
| `token` | Your [API token](https://biigle.de/settings/tokens). |
| `model_type` | Either `'project'` or `'volume'`, depending on if you want to download patches of annotations of a project or a volume. |
| `model_id` | ID of the project/volume to download the Largo patches from. You can find the ID in the URL bar of your browser. Example: `https://biigle.de/volumes/464` is the volume with ID 464. |
| `label_id` | ID of the label to download the Largo patches for. You can find the ID of a label in the JSON output of the label tree API endpoint. Try [`https://biigle.de/api/v1/label-trees/1`](https://biigle.de/api/v1/label-trees/1). Set -1 to download for all labels.|

The script downloads the Largo patches into folders  `patches/<label_id>_<label_name>/`. In addition the folder is compressed to one zip file patches.zip for easier download.
