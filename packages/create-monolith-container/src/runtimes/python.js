const buildGetPythonDependencies = context => appContext => {
  const { deps } = appContext;
  return ['python3', 'py3-pip', ...deps];
}

const buildGetPythonCommmand = context => appContext => {
  let { cmd, args } = appContext;
  if (!cmd) {
    cmd = 'python3';
  }
  if (args.length <= 0) {
    args = ['app.py'];
  }
  const command = [cmd, ...args].join(' ');
  return command;
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
