const { buildContainer } = require('./build');
const { getConfig } = require('./config');
const { createContext } = require('./context');
const { fetchAppSources } = require('./fetch');
const { setup, teardown } = require('./lifecycle');
const { prepareWorkspace } = require('./prepare');

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
    await fetchAppSources(context);
    context.setValue('fetch', true);

    await prepareWorkspace(context);
    context.setValue('create', true);

    await buildContainer(context);
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
