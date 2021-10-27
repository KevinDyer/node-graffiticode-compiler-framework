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
  let { lang, repoUrl, runtime, cmd, args, deps } = compiler;
  runtime = createRuntime(runtime);
  entities[lang] = { lang, repoUrl, runtime, cmd, args, deps };
  return entities;
};

const setup = async (context) => {
  const buildDir = await fs.mkdtemp(path.join(os.tmpdir(), 'create-monolith-container-'));
  context.setValue('buildDir', buildDir);

  const compilersDir = path.join(buildDir, 'compilers');
  await fs.mkdir(compilersDir);
  context.setValue('compilersDir', compilersDir);

  const createRuntime = makeRuntimeFactory(context);
  const { compilers } = context.getConfig();
  const ids = compilers.map(({ lang }) => lang);
  const entities = compilers.reduce(createCompilerEntity(createRuntime), {});
  context.setValue('compilerIds', ids);
  context.setValue('compilerContexts', entities);
};

const selectCompilerContext = context => compilerId => context.getValue('compilerContexts')[compilerId];
const selectCompilerContexts = context =>
  context.getValue('compilerIds')
    .map(selectCompilerContext(context));

const fetchSource = context => async (compilerContext) => {
  const { lang, repoUrl } = compilerContext;
  const compilersDir = context.getValue('compilersDir');

  const git = simpleGit({ baseDir: compilersDir });
  await git.clone(repoUrl, lang);

  compilerContext.localPath = path.join(compilersDir, lang);
};

const fetchSources = async (context) => {
  await Promise.all(selectCompilerContexts(context)
    .map(fetchSource(context)));
};

const createCompilerRunScript = context => async (compilerContext) => {
  const { lang, localPath, runtime } = compilerContext;
  const runScriptPath = path.join(localPath, 'run.sh');
  await fs.writeFile(runScriptPath, `#!/bin/bash

# TODO Add environment

# Run ${lang}
${runtime.getCommand(compilerContext)}
`);
  await fs.chmod(runScriptPath, 0o775);
  compilerContext.runScriptPath = runScriptPath;

  // const data = await fs.readFile(runScriptPath, 'utf-8');
  // console.log(data);
};

const createCompilerRunScripts = async (context) => {
  await Promise.all(selectCompilerContexts(context)
    .map(createCompilerRunScript(context)));
};

const createApiRunScript = async () => { };

const createInitWrapperScript = async (context) => {
  const apiRunScriptPath = context.getValue('apiRunScriptPath');
  const compilerIds = context.getValue('compilerIds');
  const buildDir = context.getValue('buildDir');
  const initWrapperScriptPath = path.join(buildDir, 'init_wrapper_script.sh');

  await fs.writeFile(initWrapperScriptPath, `#!/bin/bash

# Start api
${apiRunScriptPath}
${compilerIds
      .map(selectCompilerContext(context))
      .map(({ lang }) => `
# Start ${lang}
(cd compilers/${lang} && ./run.sh) &
`).join('')}
# Wait for any process to exit
wait -n

# Exit with status of process that exited first
exit $?
`);
  context.setValue('initWrapperScriptPath', initWrapperScriptPath);

  // const data = await fs.readFile(initWrapperScriptPath, 'utf-8');
  // console.log(data);
};

const createDockerfile = async (context) => {
  selectCompilerContexts(context);
};

const prepareWorkspace = async (context) => {
  await createCompilerRunScripts(context);
  await createApiRunScript(context);
  await createInitWrapperScript(context);
  await createDockerfile(context);
};

const buildContainer = async (context) => {
  const buildDir = context.getValue('buildDir');
  const dockerfilePath = path.join(buildDir, 'Dockerfile');

  const compilerContexts = selectCompilerContexts(context);
  const deps = Array.from(compilerContexts
    .map(c => c.runtime.getDependencies(c))
    .reduce((prev, curr) => [...prev, ...curr], [])
    .reduce((deps, dep) => deps.add(dep), new Set())
    .keys());

  await fs.writeFile(dockerfilePath, `# syntax=docker/dockerfile:1
FROM alpine

WORKDIR /usr/src/monolith

RUN apk add --no-cache bash ${deps.join(' ')}

${compilerContexts.map(compilerContext => `
# Build ${compilerContext.lang}
${compilerContext.runtime.getDockerfileCommands(compilerContext)}
`).join('')}

${compilerContexts.map(({ lang }) => `COPY compilers/${lang}/run.sh compilers/${lang}/run.sh`).join('\n')}
COPY init_wrapper_script.sh ./
CMD ["bash", "init_wrapper_script.sh"]
`);

  // const data = await fs.readFile(dockerfilePath, 'utf-8');
  // console.log(data);

  await new Promise((resolve, reject) => {
    const proc = exec("docker build -t monolith .", { cwd: buildDir });
    proc.on('exit', (code, signal) => {
      console.log(code, signal);
      if (code !== 0) {
        reject(new Error(`docker ubild failed with exit code${code}`));
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
    await fetchSources(context);
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
