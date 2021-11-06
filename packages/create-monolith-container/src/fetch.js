const path = require('path');
const simpleGit = require('simple-git');
const { selectAppContexts } = require('./utils');

const fetchAppSource = context => async (appContext) => {
  const { lang, repoUrl } = appContext;
  const appsDir = context.getValue('appsDir');

  const git = simpleGit({ baseDir: appsDir });
  await git.clone(repoUrl, lang);

  appContext.localPath = path.join(appsDir, lang);
};

exports.fetch = async (context) => {
  await Promise.all(selectAppContexts(context)
    .map(fetchAppSource(context)));
};
