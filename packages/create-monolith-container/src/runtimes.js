const buildGetNodeDependencies = context => compilerContext => {
  const { deps } = compilerContext;
  return ['nodejs', ...deps];
}

const buildGetNodeCommmand = context => compilerContext => {
  let { cmd, args } = compilerContext;
  if (!cmd) {
    cmd = 'node';
  }
  return [cmd, ...args].join(' ');
}

const buildGetNodeDockerfileCommands = context => compilerContext => {
  return `COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
RUN npm ci --production
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
