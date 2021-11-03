const { createNodeRuntime } = require('./node');
const { createPythonRuntime } = require('./python');

exports.makeRuntimeFactory = context => runtime => {
  if (runtime === 'nodejs') {
    return createNodeRuntime(context);
  } else if (runtime === 'python') {
    return createPythonRuntime(context);
  } else {
    throw new Error(`Unknown runtime: "${runtime}"`)
  }
};