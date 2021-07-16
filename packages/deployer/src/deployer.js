const fs = require('fs');
const path = require('path');

const tar = require('tar');

const bundleSourceCode = async (options) => {
  const response = {
    output: path.join(options.directory, `source.tar.gz`),
  };
  await new Promise((resolve, reject) => {
    tar.c({ z: true }, [options.directory])
      .pipe(fs.createWriteStream(response.output))
      .on('error', reject)
      .on('finish', resolve);
  });
};

exports.deployProject = async (options) => {
  console.log(options);
  await bundleSourceCode(options);
};