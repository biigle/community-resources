from biigle import Api
import os
import asyncio
import aiohttp  # pip install aiohttp
import aiofiles # pip install aiofiles



# # Enter your user email address here.
email = ''
# # Enter your API token here.
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

def asyncDownloadImages(annotations):
    os.makedirs(str(label_id), exist_ok=True)
    sema = asyncio.BoundedSemaphore(10)

    async def fetch_file(annotation_id, image_uuid):
        patch_url = 'https://biigle.de/storage/largo-patches/{}/{}/{}/{}.jpg'
        url = patch_url.format(image_uuid[:2], image_uuid[2:4], image_uuid, annotation_id)
        fname = url.split("/")[-1]
        async with sema, aiohttp.ClientSession() as session:
            async with session.get(url) as resp:
                assert resp.status == 200
                data = await resp.read()

        async with aiofiles.open(
            os.path.join(str(label_id), fname), "wb"
        ) as outfile:
            await outfile.write(data)

    loop = asyncio.get_event_loop()
    tasks = [loop.create_task(fetch_file(annotation_id, image_uuid )) for annotation_id, image_uuid  in annotations.items()]
    loop.run_until_complete(asyncio.wait(tasks))
    loop.close()

asyncDownloadImages(annotations)