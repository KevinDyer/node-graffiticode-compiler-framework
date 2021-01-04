#!/usr/bin/env node

// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Compiler, getCompiler, getServer} from './invoker';
import * as minimist from 'minimist';
import {resolve} from 'path';

// Exports
export * from './auth';
export * from './invoker';

// Supported command-line flags
const FLAG = {
  TARGET: 'target',
  PORT: 'port',
  SOURCE: 'source',
};

// Supported environment variables
const ENV = {
  TARGET: 'FUNCTION_TARGET',
  PORT: 'PORT',
  SOURCE: 'FUNCTION_SOURCE',
};

enum NodeEnv {
  PRODUCTION = 'production',
}

const argv = minimist(process.argv, {
  string: [FLAG.PORT, FLAG.TARGET, FLAG.SOURCE],
});

const CODE_LOCATION = resolve(
  process.cwd(),
  argv[FLAG.SOURCE] || process.env[ENV.SOURCE] || '.'
);
const PORT = argv[FLAG.PORT] || process.env[ENV.PORT] || '8080';
const TARGET = argv[FLAG.TARGET] || process.env[ENV.TARGET] || 'target';

if (!module.parent) {
  const compiler = getCompiler(CODE_LOCATION, TARGET) as Compiler;
  if (!compiler) {
    throw new Error('Could not load the compiler.');
  }

  const server = getServer(compiler);
  server.listen(PORT, () => {
    if (process.env.NODE_ENV !== NodeEnv.PRODUCTION) {
      console.log(`Serving compiler ${compiler.language}...`);
      console.log(`Compiler: ${TARGET}`);
      console.log(`URL: http://localhost:${PORT}/`);
    }
  });
}
