const { exec } = require('child_process');

exports.buildContainer = async (context) => {
  const buildDir = context.getValue('buildDir');

  await new Promise((resolve, reject) => {
    const proc = exec("docker build -t monolith .", { cwd: buildDir });
    let stderr = '';
    proc.stderr.on('data', chunk => stderr += chunk.toString());
    proc.on('exit', (code, signal) => {
      if (code !== 0) {
        reject(new Error(`docker build failed with exit code: ${code}\n${stderr}`));
      } else {
        resolve();
      }
    });
  });
};
