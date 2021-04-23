# BIIGLE API Wrapper

This is a thin wrapper for the BIIGLE API written in Python. It is intended as a foundation for new custom scripts.

## Installation

This script requires the `requests` package. Install it with `pip install requests`.

## Usage

The API wrapper is instantiated with the user email address and [API token](https://biigle.de/settings/tokens) as arguments. For additional arguments, take a look at the [script](biigle.py). The `Api` object provides the `get`, `post`, `put` and `delete` methods for API calls. Each method expects an URL (without the `api/v1` prefix) as first argument and any argument of the [request method](http://docs.python-requests.org/en/master/user/quickstart/#make-a-request) with the same name. The methods return a [response object](http://docs.python-requests.org/en/master/user/quickstart/#response-content).

Example:

```python
from biigle import Api

email = 'joe@example.com'
token = 'kxMif2STrhIHkUrbB7AhR1rDiN1Y5USq'
api = Api(email, token)

# Get all projects that the user can access.
# See: https://biigle.de/doc/api/index.html#api-Projects-IndexProjects
projects = api.get('projects').json()

# Get information on the members of a specific project.
# See: https://biigle.de/doc/api/index.html#api-Projects-IndexProjectUsers
members = api.get('projects/{}/users'.format(projects[0]['id'])).json()

# Remove the first member from the first project.
# See: https://biigle.de/doc/api/index.html#api-Projects-DestroyProjectUsers
api.delete('projects/{}/users/{}'.format(projects[0]['id'], members[0]['id']))

# Update the name of the first project.
# See: https://biigle.de/doc/api/index.html#api-Projects-UpdateProjects
api.put('projects/{}'.format(projects[0]['id']), json={'name': 'New Project Name'})
```

## Environment variables

It is safer to use environment variables or a separate `.env` file to store your access credentials. To enable support for a `.env` file, install the `python-dotenv` package. Then rename the `.env.example` file to `.env` and enter your email and token there. You can then simply get the API wrapper like this:

```python
from biigle import Api

api = Api()
```
