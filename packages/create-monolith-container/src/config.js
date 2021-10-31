const path = require('path');
const { URL } = require('url');

const buildCompiler = compiler => {
  if (/^\d+$/.test(compiler)) {
    compiler = `L${compiler}`;
  }
  let repoUrl;
  if (/^[Ll]\d+$/.test(compiler)) {
    compiler = `L${compiler.slice(1)}`
    repoUrl = `https://github.com/artcompiler/${compiler}`;
  } else {
    repoUrl = compiler;
    const url = new URL(repoUrl);
    const lastSegmentIndex = url.pathname.lastIndexOf('/');
    let lastSegment = url.pathname.slice(lastSegmentIndex + 1);
    const match = /^[Ll]\d+/.exec(lastSegment);
    if (!match) {
      throw new Error(`Unable to determin compiler's language: "${compiler}"`);
    }
    compiler = `L${match[0].slice(1)}`
  }
  return {
    lang: compiler,
    repoUrl,
    runtime: 'nodejs',
    cmd: null,
    args: [],
    deps: [],
    env: {},
    port: null,
  };
};

const createApiContext = async ({ compilers }) => {
  const apiEnv = compilers.reduce((apiEnv, compiler) => {
    const { lang, port: compilerPort } = compiler;
    apiEnv[`BASE_URL_${lang}`] = `http://127.0.0.1:${compilerPort}`;
    return apiEnv;
  }, {});
  const apiPort = 8080;
  apiEnv['PORT'] = apiPort.toString();
  return {
    args: ['-r', '@graffiticode/tracing', 'build/src/app.js'],
    cmd: null,
    deps: [],
    env: apiEnv,
    lang: 'api',
    port: apiPort,
    repoUrl: 'https://github.com/artcompiler/api',
    runtime: 'nodejs',
  };
};

const getCompilersFromConfigFile = async (configFilePath) => {
  if (!path.isAbsolute(configFilePath)) {
    configFilePath = path.join(process.cwd(), configFilePath);
  }
  const config = require(configFilePath);

  if (config.compilers) {
    const defaultCompiler = () => ({
      args: [],
      cmd: null,
      deps: [],
      env: {},
      port: null,
      runtime: 'nodejs',
    });
    const compilers = Object.keys(config.compilers)
      .map(lang => ({
        ...defaultCompiler(),
        ...config.compilers[lang],
        lang: lang.toLocaleUpperCase(),
      }));
    return compilers;
  }
  return [];
};

const setAppPorts = ({ apps }) => {
  let nextPort = 5000;
  apps.forEach(app => {
    const port = nextPort++;
    app.port = port;
    app.env['PORT'] = port.toString();
  });
};

exports.getConfig = async (argv) => {
  let {
    config,
    compilers = [],
    removeBuildDirectory = true,
  } = argv;
  if (!Array.isArray(compilers)) {
    compilers = [compilers];
  }
  compilers = compilers.map(buildCompiler);
  if (config) {
    const configCompilers = await getCompilersFromConfigFile(config);
    compilers = [
      ...compilers,
      ...configCompilers,
    ];
  }
  if (compilers.length <= 0) {
    throw new Error('No compilers specified');
  }
  setAppPorts({ apps: compilers });

  const api = await createApiContext({ compilers });

  return {
    api,
    compilers,
    removeBuildDirectory,
  };
};