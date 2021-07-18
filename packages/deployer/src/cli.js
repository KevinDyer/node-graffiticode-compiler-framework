const fs = require('fs/promises');
const path = require('path');

const factory = require('yargs/yargs');

const { deployProject } = require('./deployer');

const parseArgumentsIntoOptions = async ({ directory }) => {
  try {
    const gitIgnoreContents = await fs.readFile(path.join(directory, '.gitignore'));
    console.log(gitIgnoreContents.toString());
  } catch (err) {
    console.log(`Failed to read .gitignore`, err);
  }
  return {
    directory: directory,
  };
};

exports.cli = (cwd) => {
  const parser = factory(null, cwd);

  parser.alias('h', 'help');
  parser.alias('v', 'version');

  parser.alias('d', 'directory')
  parser.default('directory', process.cwd());

  parser.usage(
    "$0",
    "TODO: description",
    yargs => {
      yargs.options({
        // TODO: options
      });
    },
    async (argv) => {
      const options = await parseArgumentsIntoOptions(argv);
      await deployProject(options);
    }
  );

  return parser;
};
