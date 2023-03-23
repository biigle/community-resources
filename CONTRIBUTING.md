# Contributing Guidelines

Please follow these guidelines when you want to add a script to this repository.

Do you want to add another resource? Then you can directly add your link and description to the "other resources" table of the main readme (see [submission](#submission)).

## Structure

Each script should have the following structure:

- A directory that has the same name than the main script. Example: `my-script`.
- A main script inside the directory. Example: `my-script.py`.
- A readme file that is called `README.md` inside the directory.
- (optional) Other files supporting the main script or readme inside the directory.

## Readme

The readme file should contain all the information that is needed to use your script. You should include detailed information on installation steps, possible configuration parameters and usage examples.

## Language

As BIIGLE is written in PHP and Python 3, we prefer these languages for custom scripts to keep fragmentation low. However, we are happy to accept scripts written in other languages if they are well documented, too.

## Submission

To submit a new custom script, create a [fork](https://help.github.com/articles/about-forks/) of this repository and add the new directory of your script to it. In addition to that, add a link to your new script and a short description to the "available scripts" list in the [main readme](README.md) of this repository. Example entry:

```markdown
| [`my-script`](my-script) | Use the API to perform some task. |
```

Finally, [create a pull request](https://help.github.com/articles/creating-a-pull-request-from-a-fork/) from your fork. Please be aware that your script will be published under the [MIT license](LICENSE).
