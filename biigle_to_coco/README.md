# Biigle to coco

Create a json report in the standard Coco format from the csv Biigle report.

## Required dependencies

+import numpy as np

+import json

+import pandas as pd

+import warnings

+import sys

+import csv


## Usage

Set the following variables at the top of the script:

| Name | Description |
| --- | --- |
| `csv_name` | The name of the csv Biigle report |
| `path` | path of the csv Biigle report (input file) |
| `save_json_path` | path of the Coco report (output file) |

The result is a json file exploitable by the most common AI libraries in the 
standard Coco format.
