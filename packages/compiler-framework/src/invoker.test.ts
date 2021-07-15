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

import * as bent from 'bent';
import * as http from 'http';
import * as net from 'net';
import * as path from 'path';
import {getServer, Compiler, AuthError, InvalidArgumentError} from './invoker';

class FakeCompiler implements Compiler {
  language: string;
  _authError?: AuthError;
  _validateError?: InvalidArgumentError;
  _compileError?: Error;
  assetPath?: string;

  constructor(language: string) {
    this.language = language;
  }

  setAuthError(err?: AuthError) {
    this._authError = err;
  }

  setValidateError(err?: InvalidArgumentError) {
    this._validateError = err;
  }

  setCompileError(err?: Error) {
    this._compileError = err;
  }

  setAssertPath(assetPath: string) {
    this.assetPath = assetPath;
  }

  // tslint:disable-next-line:no-any
  async compile(code: {}, data: {}, config: {}): Promise<any> {
    if (this._compileError) {
      throw this._compileError;
    }
    return 'foo';
  }

  // tslint:disable-next-line:no-any
  async validate(code: {}, data: {}, config: {}): Promise<any> {
    if (this._validateError) {
      throw this._validateError;
    }
  }

  // tslint:disable-next-line:no-any
  async auth(token: string): Promise<any> {
    if (this._authError) {
      throw this._authError;
    }
  }
}

function createAndStartServer(
  compiler: Compiler
): Promise<{
  server: http.Server;
}> {
  return new Promise(resolve => {
    const server = getServer(compiler);
    server.listen(0, () => {
      resolve({
        server,
      });
    });
  });
}

function closeServer(server: http.Server) {
  return new Promise(resolve => server.close(resolve));
}

describe('invoker', () => {
  let compiler: FakeCompiler;
  let server: http.Server;
  beforeEach(async () => {
    compiler = new FakeCompiler('LTest');
    const ret = await createAndStartServer(compiler);
    server = ret.server;
  });

  afterEach(async () => {
    if (server) {
      await closeServer(server);
    }
  });

  it('should return language greeting', async () => {
    // Arrange
    const {port} = server.address() as net.AddressInfo;
    const getRoot = bent(`http://127.0.0.1:${port}`, 'string');

    // Act
    const actual = (await getRoot('/')) as string;

    // Assert
    expect(actual).toBe('Hello, LTest!');
  });

  it('should return language string', async () => {
    // Arrange
    const {port} = server.address() as net.AddressInfo;
    const getLang = bent(`http://127.0.0.1:${port}`, 'string');

    // Act
    const actual = (await getLang('/lang')) as string;

    // Assert
    expect(actual).toBe('LTest');
  });

  it('should return 404 if no assetPath', async () => {
    // Arrange
    const {port} = server.address() as net.AddressInfo;
    const getAsset = bent(`http://127.0.0.1:${port}`, 404);

    // Act
    const stream = (await getAsset('/style.css')) as bent.FetchResponse;

    // Assert
    expect(stream.statusCode).toBe(404);
  });

  it('should return asset if assetPath and exists', async () => {
    // Arrange
    await closeServer(server);
    compiler.setAssertPath(path.join(__dirname, '..', 'test', 'assets'));
    const ret = await createAndStartServer(compiler);
    server = ret.server;
    const {port} = server.address() as net.AddressInfo;
    const getAsset = bent(`http://127.0.0.1:${port}`, 'string');

    // Act
    const actual = (await getAsset('/style.css')) as string;

    // Assert
    expect(actual).toBe('.foo {\n  display: flex;\n}');
  });

  it('should return 404 if assetPath, but asset does not exist', async () => {
    // Arrange
    await closeServer(server);
    compiler.setAssertPath(__dirname + '/assets');
    const ret = await createAndStartServer(compiler);
    server = ret.server;
    const {port} = server.address() as net.AddressInfo;
    const getAsset = bent(`http://127.0.0.1:${port}`, 404);

    // Act
    const stream = (await getAsset('/boo.js')) as bent.FetchResponse;

    // Assert
    expect(stream.statusCode).toBe(404);
  });

  it('should return compiled value', async () => {
    // Arrange
    const {port} = server.address() as net.AddressInfo;
    const postCompile = bent(`http://127.0.0.1:${port}`, 'POST', 'json');

    // Act
    const actual = await postCompile('/compile', {code: {}, data: {}});

    // Assert
    expect(actual).toBe('foo');
  });

  it('should return error if compile throws', async () => {
    // Arrange
    compiler.setCompileError(new Error('failed to compile'));
    const {port} = server.address() as net.AddressInfo;
    const postCompile = bent(`http://127.0.0.1:${port}`, 'POST', 500);

    // Act
    const stream = (await postCompile('/compile', {
      code: {},
      data: {},
    })) as bent.FetchResponse;
    const actual = await stream.text();

    // Assert
    expect(stream.statusCode).toBe(500);
    expect(actual).toBe('Internal Server Error');
  });

  it('should return error if auth throws', async () => {
    // Arrange
    compiler.setAuthError(new AuthError('invalid token'));
    const {port} = server.address() as net.AddressInfo;
    const postCompile = bent(`http://127.0.0.1:${port}`, 'POST', 401);

    // Act
    const stream = (await postCompile('/compile', {
      code: {},
      data: {},
    })) as bent.FetchResponse;
    const actual = await stream.text();

    // Assert
    expect(stream.statusCode).toBe(401);
    expect(actual).toBe('Unauthorized');
  });

  it('should return error if validate throws', async () => {
    // Arrange
    compiler.setValidateError(new InvalidArgumentError('invalid code'));
    const {port} = server.address() as net.AddressInfo;
    const postCompile = bent(`http://127.0.0.1:${port}`, 'POST', 400);

    // Act
    const stream = (await postCompile('/compile', {
      code: {},
      data: {},
    })) as bent.FetchResponse;
    const actual = await stream.text();

    // Assert
    expect(stream.statusCode).toBe(400);
    expect(actual).toBe('invalid code');
  });
});
