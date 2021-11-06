const fs = require('fs/promises');
const path = require('path');

const { selectAppContexts } = require('./utils');

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
  context.setValue('dockerfilePath', dockerfilePath);

  // const data = await fs.readFile(dockerfilePath, 'utf-8');
  // console.log(data);
};

exports.prepare = async (context) => {
  await createAppRunScripts(context);
  await createInitWrapperScript(context);
  await createDockerfile(context);
};
