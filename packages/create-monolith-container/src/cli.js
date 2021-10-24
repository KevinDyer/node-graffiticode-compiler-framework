'use strict';

const factory = require('yargs/yargs');
const createMonolithContainer = require('./create-monolith-container');

module.exports = cli;

function cli(cwd) {
  const parser = factory(null, cwd);

  parser.alias('h', 'help');
  parser.alias('v', 'version');
  parser
    .array('compilers')
    .alias('c', 'compilers')
    .alias('compiler', 'compilers');
  parser.boolean('removeBuildDirectory');

  parser.usage(
    "$0",
    "TODO: description",
    yargs => {
      yargs.options({
        // TODO: options
      });
    },
    argv => createMonolithContainer(argv)
  );

  return parser;
}
