// Copyright 2019 Google LLC
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

import * as express from 'express';
import * as http from 'http';

export interface CompileFunction {
  // tslint:disable-next-line:no-any
  (code: {}, data: {}, config: {}): Promise<any>;
}

export interface ValidateFunction {
  // tslint:disable-next-line:no-any
  (code: {}, data: {}, config: {}): Promise<any>;
}

export interface AuthFunction {
  // tslint:disable-next-line:no-any
  (token: string): Promise<any>;
}

export class AuthError extends Error {}
export class InvalidArgumentError extends Error {}

export interface Compiler {
  language: string;
  compile: CompileFunction;
  auth?: AuthFunction;
  validate?: ValidateFunction;
}

function getModulePath(codeLocation: string): string | null {
  let path: string | null = null;
  try {
    path = require.resolve(codeLocation);
  } catch (ex) {
    console.error(ex.stack);
    try {
      // TODO: Decide if we want to keep this fallback.
      path = require.resolve(codeLocation + '/function.js');
    } catch (ex) {
      console.error(ex.stack);
    }
  }
  return path;
}

function getModuleProperty(
  codeLocation: string,
  target: string
  // tslint:disable-next-line:no-any
): any | null {
  try {
    const modulePath = getModulePath(codeLocation);
    if (modulePath === null) {
      console.error('Provided code is not a loadable module.');
      return null;
    }

    const module = require(modulePath);
    const property = target.split('.').reduce((code, targetPart) => {
      if (typeof code === 'undefined') {
        return undefined;
      } else {
        return code[targetPart];
      }
    }, module);
    return property;
  } catch (ex) {
    let additionalHint: string;
    // TODO: this should be done based on ex.code rather than string matching.
    console.log(ex.code);
    if (ex.stack.includes('Cannot find module')) {
      additionalHint =
        'Did you list all required modules in the package.json ' +
        'dependencies?\n';
    } else {
      additionalHint = 'Is there a syntax error in your code?\n';
    }
    console.error(
      `Provided module can't be loaded.\n${additionalHint}` +
        `Detailed stack trace: ${ex.stack}`
    );
    return null;
  }
}

export function getCompiler(
  codeLocation: string,
  target: string
): Compiler | null {
  return getModuleProperty(codeLocation, target) as Compiler;
}

function makeRootHandler(language: string): express.RequestHandler {
  return (req: express.Request, res: express.Response) => {
    res.status(200).send(`Hello, ${language}!`);
  };
}

function makeLanguageHandler(language: string): express.RequestHandler {
  return (req: express.Request, res: express.Response) => {
    res.status(200).send(language);
  };
}

function makeCompileHandler(compiler: Compiler): express.RequestHandler {
  return async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      const { token, code, data, config = {} } = req.body;
      if (compiler.auth) {
        await compiler.auth(token);
      }
      if (compiler.validate) {
        await compiler.validate(code, data, config);
      }
      const result = await compiler.compile(code, data, config);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };
}

function makeErrorHandler(): express.ErrorRequestHandler {
  return async (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    // console.log(`---- ---- ----`);
    // console.error(err.stack);
    // console.log(`---- ---- ----`);
    if (err instanceof AuthError) {
      res.sendStatus(401);
    } else if (err instanceof InvalidArgumentError) {
      res.status(400).send(err.message);
    } else {
      res.sendStatus(500);
    }
  };
}

export function getServer(compiler: Compiler): http.Server {
  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.get('/', makeRootHandler(compiler.language));
  app.get('/lang', makeLanguageHandler(compiler.language));
  app.post('/compile', makeCompileHandler(compiler));
  app.use(makeErrorHandler());
  return http.createServer(app);
}
