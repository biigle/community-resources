import sys
import copy
from requests.exceptions import HTTPError
from biigle import Api

# Enter your user email address here.
email = ''
# Enter your API token here.
token = ''
# ID of the volume to process.
volume_id = 0
# ID of the label to attach to new annotations.
label_id = 0
# Number of grid rows for each image.
rows = 3
# Number of grid columns for each image.
columns = 3
# Assume that all images of the volume have the same dimension.
assume_same_dimension = True

api = Api(email, token)

# Get the available annotation shapes.
# https://biigle.de/doc/api/index.html#api-Shapes-IndexShapes
shapes = api.get('shapes').json()
shapes = {s['name']: s['id'] for s in shapes}

# Get the list of image IDs that belong to the volume.
# https://biigle.de/doc/api/index.html#api-Volumes-IndexVolumeImages
image_ids = api.get('volumes/{}/images'.format(volume_id)).json()
rectangle_width = 0
rectangle_height = 0
post_data = {
   'shape_id': shapes['Rectangle'],
   'label_id': label_id,
   'confidence': 1,
   'points': [],
}

total = len(image_ids) * rows * columns
current = 0

can_batch_create = True
try:
   api.post('annotations')
except HTTPError as e:
   can_batch_create = False
batch_size = 100
batch = []

for image_id in image_ids:
   if not assume_same_dimension or not rectangle_width or not rectangle_height:
      # Get detailed information on an image, including width and height in pixels.
      # https://biigle.de/doc/api/index.html#api-Images-ShowImages
      image_info = api.get('images/{}'.format(image_id)).json()
      width, height = image_info['attrs']['width'], image_info['attrs']['height']
      rectangle_width = width // columns
      rectangle_height = height // rows

   for row in range(rows):
      y = row * rectangle_height
      for column in range(columns):
         x = column * rectangle_width
         post_data['points'] = [
            x, y,
            x + rectangle_width, y,
            x + rectangle_width, y + rectangle_height,
            x, y + rectangle_height,
         ]

         if can_batch_create:
            post_data['image_id'] = image_id
            batch.append(copy.copy(post_data))
            if len(batch) == batch_size:
               api.post('annotations', json=batch)
               batch = []
         else:
            # Create a new rectangle annotation for the image.
            # https://biigle.de/doc/api/index.html#api-Annotations-StoreImageAnnotations
            api.post('images/{}/annotations'.format(image_id), json=post_data)

         current += 1
         print('Created {} of {}'.format(current, total))

if can_batch_create and len(batch) > 0:
   api.post('annotations', json=batch)
