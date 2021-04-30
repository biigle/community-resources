import sys
from requests.exceptions import HTTPError
from biigle import Api
import argparse
from os import listdir
from os.path import isfile, join

parser = argparse.ArgumentParser(description="Create a new BIIGLE volume based on files of a local directory.")
parser.add_argument('project_id', type=int, help='ID of the project to attach the new volume to.')
parser.add_argument('volume_url', type=str, help='URL of the new volume.')
parser.add_argument('volume_name', type=str, help='Name of the new volume.')
parser.add_argument('volume_dir', type=str, help='Local directory to extract the filenames from.')

parser.add_argument("-m", "--media-type", dest='media_type', type=str, default='image', help="Volume media type (image or video). Default: image")
args = vars(parser.parse_args())

project_id = args['project_id']
volume_name = args['volume_name']
volume_url = args['volume_url']
media_type = args['media_type']
volume_dir = args['volume_dir']

files = [f for f in listdir(volume_dir) if isfile(join(volume_dir, f))]

api = Api()

api.post('projects/{}/volumes'.format(project_id), json={
   'name': volume_name,
   'url': volume_url,
   'media_type': media_type,
   'files': files,
})

print('Done.')
