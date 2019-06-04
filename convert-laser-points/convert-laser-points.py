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
# ID of the laser point label.
label_id = 1558

api = Api(email, token)

# Get the available annotation shapes.
# https://biigle.de/doc/api/index.html#api-Shapes-IndexShapes
shapes = api.get('shapes').json()
shapes = {s['name']: s['id'] for s in shapes}

# Get the list of image IDs that belong to the volume.
# https://biigle.de/doc/api/index.html#api-Volumes-IndexVolumeImages
image_ids = api.get('volumes/{}/images'.format(volume_id)).json()
post_data = {
   'shape_id': shapes['Point'],
   'label_id': label_id,
   'confidence': 1,
   'points': [],
}

can_batch_create = True
try:
   api.post('annotations')
except HTTPError as e:
   can_batch_create = False
batch_size = 100
batch = []

for image_id in image_ids:
   image_info = api.get('images/{}/laserpoints'.format(image_id)).json()

   if not image_info:
      print('No laser point detections for image {}, skipping.'.format(image_id))
      continue

   if image_info.get('error', False):
      print('Laser point detection failed for image {}, skipping.'.format(image_id))
      continue

   if image_info['method'] == 'manual':
      # This image already has manual laser point annotations.
      continue

   for point in image_info['points']:
      post_data['points'] = point
      if can_batch_create:
         post_data['image_id'] = image_id
         batch.append(copy.copy(post_data))
         if len(batch) == batch_size:
            api.post('annotations', json=batch)
            batch = []
      else:
         # Create a new annotation for the image.
         # https://biigle.de/doc/api/index.html#api-Annotations-StoreImageAnnotations
         api.post('images/{}/annotations'.format(image_id), json=post_data)

if can_batch_create and len(batch) > 0:
   api.post('annotations', json=batch)

print('Finished.')
