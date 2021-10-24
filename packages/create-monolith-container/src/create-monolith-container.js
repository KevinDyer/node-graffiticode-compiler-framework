const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const simpleGit = require('simple-git');
const { URL } = require('url');

const getConfig = (argv) => {
  let {
    removeBuildDirectory = true,
    compilers = [],
  } = argv;
  if (!Array.isArray(compilers)) {
    compilers = [compilers];
  }
  if (compilers.length <= 0) {
    throw new Error('No compilers specified');
  }

  compilers = compilers.map(compiler => {
    if (/^\d+$/.test(compiler)) {
      compiler = `L${compiler}`;
    }
    let repoPath;
    if (/^[Ll]\d+$/.test(compiler)) {
      compiler = `L${compiler.slice(1)}`
      repoPath = `https://github.com/artcompiler/${compiler}`;
    } else {
      repoPath = compiler;
      const repoUrl = new URL(repoPath);
      const lastSegmentIndex = repoUrl.pathname.lastIndexOf('/');
      let lastSegment = repoUrl.pathname.slice(lastSegmentIndex + 1);
      const match = /^[Ll]\d+/.exec(lastSegment);
      if (!match) {
        throw new Error(`Unable to determin compiler's language: "${compiler}"`);
      }
      compiler = `L${match[0].slice(1)}`
    }
    return { lang: compiler, repoPath };
  });

  return {
    removeBuildDirectory,
    compilers,
  };
};

const createContext = (config) => {
  const values = new Map();
  return {
    getConfig: () => config,
    setValue: (key, value) => values.set(key, value),
    getValue: (key) => values.get(key),
    hasValue: (key) => values.has(key),
  };
};

const setup = async (context) => {
  const buildDir = await fs.mkdtemp(path.join(os.tmpdir(), 'create-monolith-container-'));
  context.setValue('buildDir', buildDir);

  const compilerDir = path.join(buildDir, 'compilers');
  await fs.mkdir(compilerDir);
  context.setValue('compilerDir', compilerDir);

};

const fetchSource = context => async ({ lang, repoPath }) => {
  const compilerDir = context.getValue('compilerDir');
  const git = simpleGit({ baseDir: compilerDir });
  await git.clone(repoPath, lang);
};

const fetchSources = async (context) => {
  const { compilers } = context.getConfig();

  await Promise.all(compilers.map(fetchSource(context)));

  const compilerDir = context.getValue('compilerDir');
  const files = await fs.readdir(compilerDir, { withFileTypes: true });
  console.log(files.map(file => file.name));
};

const createInitScript = async (context) => {
  const { compilers } = context.getConfig();

};

const buildContainer = async (context) => {
  const { compilers } = context.getConfig();

};

const teardown = async (context) => {
  const { removeBuildDirectory } = context.getConfig();

  if (removeBuildDirectory) {
    const buildDir = context.getValue('buildDir');
    fs.rm(buildDir, { recursive: true, force: true });
  }
};

const createMonolithContainer = async (argv) => {
  const config = getConfig(argv);
  const context = createContext(config);

  try {
    await setup(context);
  } catch (err) {
    console.warn(`Failed to setup: ${err.message}\n${err.stack}`);
    return;
  }

  try {
    await fetchSources(context);
    context.setValue('fetch', true);

    await createInitScript(context);
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
