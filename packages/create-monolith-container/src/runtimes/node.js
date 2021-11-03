const buildGetNodeDependencies = context => appContext => {
  const { deps } = appContext;
  return ['nodejs', 'npm', ...deps];
}

const buildGetNodeCommmand = context => appContext => {
  let { lang, cmd, args, env } = appContext;
  const environment = Object.keys(env)
    .reduce((prev, key, index) => prev + `${index > 0 ? '\n' : ''}export ${key}=${env[key]}`, '');
  if (!cmd) {
    cmd = 'node';
  }
  if (args.length <= 0) {
    args = ['.'];
  }
  const command = [cmd, ...args].join(' ');
  return `
cd apps/${lang}

# Environment
${environment}

# Run ${lang}
${command}`;
};

const buildGetNodeDockerfileCommands = context => appContext => {
  const { lang } = appContext;
  const prefix = `./apps/${lang}`;
  return `COPY ${prefix}/package*.json ${prefix}/
RUN npm --prefix=${prefix} install
COPY ${prefix} ${prefix}
RUN npm --prefix=${prefix} run --if-present build
RUN npm --prefix=${prefix} ci --production
`;
};

exports.createNodeRuntime = context => ({
  getCommand: buildGetNodeCommmand(context),
  getDependencies: buildGetNodeDependencies(context),
  getDockerfileCommands: buildGetNodeDockerfileCommands(context),
});
