const buildGetNodeDependencies = context => compilerContext => {
  const { deps } = compilerContext;
  return ['nodejs', 'npm', ...deps];
}

const buildGetNodeCommmand = context => compilerContext => {
  let { cmd, args } = compilerContext;
  if (!cmd) {
    cmd = 'node';
  }
  return [cmd, ...args].join(' ');
}

const buildGetNodeDockerfileCommands = context => compilerContext => {
  const { lang } = compilerContext;
  const prefix = `./compilers/${lang}`;
  return `COPY ${prefix}/package*.json ${prefix}/
RUN npm --prefix=${prefix} install
COPY ${prefix} ${prefix}
RUN npm --prefix=${prefix} run --if-present build
RUN npm --prefix=${prefix} ci --production
`;
};

const createNodeRuntime = context => ({
  getCommand: buildGetNodeCommmand(context),
  getDependencies: buildGetNodeDependencies(context),
  getDockerfileCommands: buildGetNodeDockerfileCommands(context),
});

exports.makeRuntimeFactory = context => runtime => {
  if (runtime === 'nodejs') {
    return createNodeRuntime(context);
  } else {
    throw new Error(`Unknown runtime: "${runtime}"`)
  }
};
