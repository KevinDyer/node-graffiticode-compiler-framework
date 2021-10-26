const fs = require('fs/promises');
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

exports.getConfig = async (argv) => {
  let {
    compilers = [],
    removeBuildDirectory = true,
  } = argv;

  if (!Array.isArray(compilers)) {
    compilers = [compilers];
  }
  if (compilers.length <= 0) {
    throw new Error('No compilers specified');
  }
  compilers = compilers.map(buildCompiler);

  return {
    removeBuildDirectory,
    compilers,
  };
};