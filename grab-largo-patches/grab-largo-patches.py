import shutil
import requests
from requests.exceptions import HTTPError
from biigle import Api

# Enter your user email address here.
email = ''
# Enter your API token here.
token = ''
# Type of the model to process (either project or volume)
model_type = 'project'
# ID of the project/volume to process.
model_id = 0
# ID of the label to fetch Largo patches for.
label_id = 0

api = Api(email, token)

endpoint_url = '{}s/{}/image-annotations/filter/label/{}'
annotations = api.get(endpoint_url.format(model_type, model_id, label_id)).json()

patch_url = 'https://biigle.de/storage/largo-patches/{}/{}/{}/{}.jpg'

for annotation_id, image_uuid in annotations.items():
   url = patch_url.format(image_uuid[:2], image_uuid[2:4], image_uuid, annotation_id)
   print('Fetching', url)
   patch = requests.get(url, stream=True)
   if patch.ok != True:
      raise Exception('Failed to fetch {}'.format(url))
   with open('{}.jpg'.format(annotation_id), 'wb') as f:
      patch.raw.decode_content = True
      shutil.copyfileobj(patch.raw, f)

print('Finished.')
