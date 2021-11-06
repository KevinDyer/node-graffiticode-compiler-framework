const { build } = require('./build');
const { getConfig } = require('./config');
const { createContext } = require('./context');
const { fetch } = require('./fetch');
const { setup, teardown } = require('./lifecycle');
const { prepare } = require('./prepare');

const createMonolithContainer = async (argv) => {
  let context;
  try {
    const config = await getConfig(argv);
    context = createContext(config);
    await setup(context);
  } catch (err) {
    console.warn(`Failed to setup: ${err.message}\n${err.stack}`);
    return;
  }

  try {
    await fetch(context);
    context.setValue('fetch', true);

    await prepare(context);
    context.setValue('prepare', true);

    await build(context);
    context.setValue('build', true);
  } catch (err) {
    console.warn(`Failed to create monolith container: ${err.message}\n${err.stack}`);
  }

  try {
    await teardown(context);
  } catch (err) {
    console.warn(`Failed to tear down: ${err.message}\n${err.stack}`);
  }
};

module.exports = createMonolithContainer;
