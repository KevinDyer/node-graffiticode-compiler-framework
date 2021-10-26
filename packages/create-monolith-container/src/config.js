const fs = require('fs/promises');
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
  };
};

const getCompilersFromConfigFile = async (configFilePath) => {
  if (!path.isAbsolute(configFilePath)) {
    configFilePath = path.join(process.cwd(), configFilePath);
  }
  const config = require(configFilePath);

  if (config.compilers) {
    const defaultCompiler = {
      cmd: null,
      args: [],
      deps: [],
    }
    const compilers = Object.keys(config.compilers)
      .map(compiler => ({
        ...defaultCompiler,
        ...config.compilers[compiler],
        lang: compiler.toLocaleUpperCase(),
      }));
    return compilers;
  }
  return [];
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

  return {
    removeBuildDirectory,
    compilers,
  };
};