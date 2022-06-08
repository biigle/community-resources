import json
import pandas as pd
import os
import warnings
import sys
import csv

# Inputs :
# 1.csv_path = path of the CSV file with all the Biigle annotations 
# 2.save_json_path = path of the directory where we want to save the
#                    new CSV file with the annotations

# Outputs :
# The functions transform a CSV file with the Biigle annotations in 
# a CSV file with the same annotations with coordinates in the 
# image range
    
# the path to the CSV file
path = sys.argv[1]
# csv (output) path
save_json_path = sys.argv[2]
data = pd.read_csv(path)

for row in data.itertuples():
        # get width and heigth of the image
        desired_dict = json.loads(row.attributes)
        max_heigth =  desired_dict["height"]
        max_width =  desired_dict["width"]
        # get vector of coordinates
        # row.points is a string, we want to transform it in an array of doubles
        string_array = row.points
        string_array = string_array.replace('[', '')
        string_array = string_array.replace(']', '')
        splitted_string = string_array.split (",")
        # desired_array is an array of doubles, like [x1, y1, x2, y2, ecc]
        desired_array = [float(numeric_string) for numeric_string in splitted_string]
        x_coord = map(lambda x: max(min(x, max_width), 0), desired_array[::2])
        y_coord = map(lambda y: max(min(y, max_heigth), 0), desired_array[1::2])
        # create the adjusted coordinates vector
        desired_array_adjusted = list(x_coord)    
        # convert the list into a string
        desired_array_adjusted = str(desired_array_adjusted)
        # replace the vector of coordinates
        data.at[row.Index, 'points'] = desired_array_adjusted    
# save the df
data.to_csv(save_json_path)
