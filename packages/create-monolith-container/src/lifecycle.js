const fs = require('fs/promises');
const os = require('os');
const path = require('path');

const { makeRuntimeFactory } = require('./runtimes');

const createCompilerEntity = createRuntime => (entities, compiler) => {
  const { lang, runtime } = compiler;
  entities[lang] = {
    ...compiler,
    runtime: createRuntime(runtime),
  };
  return entities;
};

exports.setup = async (context) => {
  const { api, compilers } = context.getConfig();

  const buildDir = await fs.mkdtemp(path.join(os.tmpdir(), 'create-monolith-container-'));
  context.setValue('buildDir', buildDir);

  const appsDir = path.join(buildDir, 'apps');
  await fs.mkdir(appsDir);
  context.setValue('appsDir', appsDir);

  const createRuntime = makeRuntimeFactory(context);
  const ids = compilers.map(({ lang }) => lang);
  const entities = compilers.reduce(createCompilerEntity(createRuntime), {});
  context.setValue('compilerIds', ids);
  context.setValue('compilerContexts', entities);

  context.setValue('apiContext', {
    ...api,
    runtime: createRuntime(api.runtime),
  });
};

exports.teardown = async (context) => {
  const { removeBuildDirectory } = context.getConfig();

  const buildDir = context.getValue('buildDir');
  if (removeBuildDirectory) {
    fs.rm(buildDir, { recursive: true, force: true });
  } else {
    console.log(`Build directory: ${buildDir}`);
  }
};
