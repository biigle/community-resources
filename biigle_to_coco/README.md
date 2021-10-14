# BIIGLE to COCO

Create a JSON report in the standard COCO format from the BIIGLE CSV image annotation report.

**The only supported shapes are `LineString`, `Polygon` and `Rectangle`**

## Installation

The script requires `pandas`.

## Usage

```bash
python biigle_to_coco.py [csv-input-file] [coco-output-file]
```

The result is a JSON file exploitable by most common AI libraries in the standard COCO format.
