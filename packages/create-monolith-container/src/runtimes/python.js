const buildGetPythonDependencies = context => appContext => {
  const { deps } = appContext;
  return ['python3', 'py3-pip', ...deps];
}

const buildGetPythonCommmand = context => appContext => {
  let { lang, cmd, args, env } = appContext;
  const environment = Object.keys(env)
    .reduce((prev, key, index) => prev + `${index > 0 ? '\n' : ''}export ${key}=${env[key]}`, '');
  if (!cmd) {
    cmd = 'python3';
  }
  if (args.length <= 0) {
    args = ['app.py'];
  }
  const command = [cmd, ...args].join(' ');
  return `
cd apps/${lang}

# Environment
${environment}

# Run ${lang}
${command}`;
};

const buildGetPythonDockerfileCommands = context => appContext => {
  const { lang } = appContext;
  const prefix = `./apps/${lang}`;
  return `COPY ${prefix}/requirements.txt ${prefix}/requirements.txt
RUN pip3 install -r ${prefix}/requirements.txt
COPY ${prefix} ${prefix}
`;
};

exports.createPythonRuntime = context => ({
  getCommand: buildGetPythonCommmand(context),
  getDependencies: buildGetPythonDependencies(context),
  getDockerfileCommands: buildGetPythonDockerfileCommands(context),
});
