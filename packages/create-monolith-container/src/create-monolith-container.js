const { exec } = require('child_process');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const simpleGit = require('simple-git');

const { getConfig } = require('./config');
const { makeRuntimeFactory } = require('./runtimes');

const createContext = (config) => {
  const values = new Map();
  return {
    getConfig: () => config,
    setValue: (key, value) => values.set(key, value),
    getValue: (key) => values.get(key),
    hasValue: (key) => values.has(key),
  };
};

const createCompilerEntity = createRuntime => (entities, compiler) => {
  const { lang, runtime } = compiler;
  entities[lang] = {
    ...compiler,
    runtime: createRuntime(runtime),
  };
  return entities;
};

const setup = async (context) => {
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

const selectCompilerContext = context => compilerId => context.getValue('compilerContexts')[compilerId];
const selectCompilerContexts = context =>
  context.getValue('compilerIds')
    .map(selectCompilerContext(context));
const selectAppContexts = context => {
  return [
    ...selectCompilerContexts(context),
    context.getValue('apiContext'),
  ];
};

const fetchAppSource = context => async (appContext) => {
  const { lang, repoUrl } = appContext;
  const appsDir = context.getValue('appsDir');

  const git = simpleGit({ baseDir: appsDir });
  await git.clone(repoUrl, lang);

  appContext.localPath = path.join(appsDir, lang);
};

const fetchAppSources = async (context) => {
  await Promise.all(selectAppContexts(context)
    .map(fetchAppSource(context)));
};

const createAppRunScript = context => async (appContext) => {
  const buildDir = context.getValue('buildDir');
  const { lang, runtime } = appContext;
  const runScriptPath = path.join(buildDir, `run_${lang}.sh`);
  await fs.writeFile(runScriptPath, `#!/bin/bash
${runtime.getCommand(appContext)}
`);
  await fs.chmod(runScriptPath, 0o775);
  appContext.runScriptPath = runScriptPath;

  // const data = await fs.readFile(runScriptPath, 'utf-8');
  // console.log(data);
};

const createAppRunScripts = async (context) => {
  await Promise.all(selectAppContexts(context)
    .map(createAppRunScript(context)));
};

const createInitWrapperScript = async (context) => {
  const buildDir = context.getValue('buildDir');
  const initWrapperScriptPath = path.join(buildDir, 'init_wrapper_script.sh');

  await fs.writeFile(initWrapperScriptPath, `#!/bin/bash
${selectAppContexts(context).map(({ lang }) => `
# Start ${lang}
./run_${lang}.sh &
`).join('')}
# Wait for any process to exit
wait -n

# Exit with status of process that exited first
exit $?
`);
  await fs.chmod(initWrapperScriptPath, 0o775);
  context.setValue('initWrapperScriptPath', initWrapperScriptPath);

  // const data = await fs.readFile(initWrapperScriptPath, 'utf-8');
  // console.log(data);
};

const createDockerfile = async (context) => {
  selectCompilerContexts(context);
};

const prepareWorkspace = async (context) => {
  await createAppRunScripts(context);
  await createInitWrapperScript(context);
  await createDockerfile(context);
};

const buildContainer = async (context) => {
  const buildDir = context.getValue('buildDir');
  const dockerfilePath = path.join(buildDir, 'Dockerfile');

  const appContexts = selectAppContexts(context);
  const deps = Array.from(appContexts
    .map(c => c.runtime.getDependencies(c))
    .reduce((prev, curr) => [...prev, ...curr], [])
    .reduce((deps, dep) => deps.add(dep), new Set())
    .keys());

  await fs.writeFile(dockerfilePath, `# syntax=docker/dockerfile:1
FROM alpine

WORKDIR /usr/src/monolith

RUN apk add --no-cache bash ${deps.join(' ')}

${appContexts.map(compilerContext => `
# Build ${compilerContext.lang}
${compilerContext.runtime.getDockerfileCommands(compilerContext)}
`).join('')}

${appContexts.map(({ lang }) => `COPY run_${lang}.sh ./`).join('\n')}
COPY init_wrapper_script.sh ./

EXPOSE 8080
CMD ./init_wrapper_script.sh
`);

  // const data = await fs.readFile(dockerfilePath, 'utf-8');
  // console.log(data);

  await new Promise((resolve, reject) => {
    const proc = exec("docker build -t monolith .", { cwd: buildDir });
    let stderr = '';
    proc.stderr.on('data', chunk => stderr += chunk.toString());
    proc.on('exit', (code, signal) => {
      if (code !== 0) {
        reject(new Error(`docker build failed with exit code: ${code}\n${stderr}`));
      } else {
        resolve();
      }
    });
  });
};

const teardown = async (context) => {
  const { removeBuildDirectory } = context.getConfig();

  const buildDir = context.getValue('buildDir');
  if (removeBuildDirectory) {
    fs.rm(buildDir, { recursive: true, force: true });
  } else {
    console.log(`Build directory: ${buildDir}`);
  }
};

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
