import json
import pandas as pd
import os
import warnings
import sys
import csv

# the path to the CSV file
path = sys.argv[1]
# json (output) path
save_json_path = sys.argv[2]
data = pd.read_csv(path)

def check_shape(row):
    # only polygons are accepted
    shape = row.shape_name
    flag_shape = 1
    if not(shape == "LineString" or shape == "Polygon" or shape == "Rectangle") :
        warnings.warn('The shape %s is not supported !' %(shape))
        flag_shape = 0
    return flag_shape

def image(row):
    image = {}
    # row.attributes is a string, we want to transform it in a dict
    desired_dict = json.loads(row.attributes)
    image["height"] = desired_dict["height"]
    image["width"] = desired_dict["width"]
    image["id"] = int(row.image_id)
    image["file_name"] = row.filename
    image["longitude"] = float(row.image_longitude)
    image["latitude"] = float(row.image_latitude)
    return image

def category(row):
    category = {}
    category["id"] = row.label_id
    category["name"] = row.label_name
    return category

def annotation(row):
    annotation = {}
    # row.points is a string, we want to transform it in an array of doubles
    string_array = row.points
    string_array = string_array.replace('[', '')
    string_array = string_array.replace(']', '')
    splitted_string = string_array.split (",")
    # desired_array is an array of doubles, like [x1, y1, x2, y2, ecc]
    desired_array = [float(numeric_string) for numeric_string in splitted_string]
    x_coord = desired_array[::2]  # x = even  - start at the beginning at take every second item
    y_coord = desired_array[1::2] # y = odd - start at second item and take every second item
    xmax = max(x_coord)
    ymax = max(y_coord)
    xmin = min(x_coord)
    ymin = min(y_coord)
    area = (xmax - xmin)*(ymax - ymin)
    annotation["segmentation"] = [desired_array]
    annotation["iscrowd"] = 0
    annotation["area"] = area
    annotation["image_id"] = int(row.image_id)
    annotation["bbox"] = [xmin, ymin, xmax -xmin, ymax-ymin]
    annotation["category_id"] = row.label_id
    annotation["id"] = int(row.annotation_label_id)
    return annotation

# delete rows with not supported shapes
for index, row in data.iterrows():
    if not check_shape(row) :
        data.drop(index, inplace=True)
    
images = []
categories = []
annotations = []

data['fileid'] = data['filename'].astype('category').cat.codes
data['categoryid']= pd.Categorical(data['label_name'],ordered= True).codes
data['categoryid'] = data['categoryid']+1
data['annid'] = data.index
imagedf = data.drop_duplicates(subset=['fileid']).sort_values(by='fileid')
catdf = data.drop_duplicates(subset=['categoryid']).sort_values(by='categoryid')

for row in data.itertuples():
    annotations.append(annotation(row))
    

for row in imagedf.itertuples():
    images.append(image(row))


for row in catdf.itertuples():
    categories.append(category(row))

data_coco = {}
data_coco["images"] = images
data_coco["categories"] = categories
data_coco["annotations"] = annotations
pretty_json = json.dump(data_coco, open(save_json_path, "w"), indent=4)
