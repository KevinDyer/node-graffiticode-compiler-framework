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

import * as assert from 'assert';
import * as http from 'http';
import * as net from 'net';
import {
  getServer,
  Compiler,
  AuthError,
  InvalidArgumentError,
} from '../src/invoker';

class FakeCompiler implements Compiler {
  _language: string;
  _authError?: AuthError;
  _validateError?: InvalidArgumentError;
  _compileError?: Error;

  constructor(language: string) {
    this._language = language;
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

  get language() {
    return this._language;
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

// tslint:disable-next-line:no-any
function makeRequest(options: http.RequestOptions, body?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res: http.IncomingMessage) => {
      res.once('error', reject);
      let body = Buffer.alloc(0);
      res.on('data', chunk => {
        body = Buffer.concat([body, chunk], body.length + chunk.length);
      });
      res.once('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body,
        });
      });
    });
    req.once('error', reject);
    if (body) {
      req.write(body);
    }
    req.end();
  });
}

describe('invoker', () => {
  let compiler: FakeCompiler;
  let server: http.Server;
  beforeEach('Start server', done => {
    compiler = new FakeCompiler('LTest');
    server = getServer(compiler);
    server.listen(0, '0.0.0.0', done);
  });

  afterEach('Stop server', done => {
    server.close(done);
  });

  it('should return language greeting', async () => {
    const { address, port } = server.address() as net.AddressInfo;
    const options: http.RequestOptions = {
      hostname: address,
      port,
      path: '/',
      method: 'GET',
    };
    const res = await makeRequest(options);
    const actual = res.body.toString();
    assert(res.statusCode === 200, `expected 200 but got ${res.statusCode}`);
    assert(
      actual === 'Hello, LTest!',
      `expected "Hello, LTest" from / but got ${actual}`
    );
  });

  it('should return language string', async () => {
    const { address, port } = server.address() as net.AddressInfo;
    const options: http.RequestOptions = {
      hostname: address,
      port,
      path: '/lang',
      method: 'GET',
    };
    const res = await makeRequest(options);
    const actual = res.body.toString();
    assert(res.statusCode === 200, `expected 200 but got ${res.statusCode}`);
    assert(actual === 'LTest', `expected LTest from /lang but got ${actual}`);
  });

  it('should return compiled value', async () => {
    const { address, port } = server.address() as net.AddressInfo;
    const options: http.RequestOptions = {
      hostname: address,
      port,
      path: '/compile',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };
    const body = Buffer.from(
      JSON.stringify({
        code: {},
        data: {},
      })
    );
    const res = await makeRequest(options, body);
    const actual = res.body.toString();
    assert(res.statusCode === 200, `expected 200 but got ${res.statusCode}`);
    assert(
      actual === '"foo"',
      `expected "foo" from /compile but got "${actual}"`
    );
  });

  it('should return error if compile throws', async () => {
    compiler.setCompileError(new Error('failed to compile'));

    const { address, port } = server.address() as net.AddressInfo;
    const options: http.RequestOptions = {
      hostname: address,
      port,
      path: '/compile',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };
    const body = Buffer.from(
      JSON.stringify({
        code: {},
        data: {},
      })
    );
    const res = await makeRequest(options, body);
    const actual = res.body.toString();
    assert(res.statusCode === 500, `expected 500 but got ${res.statusCode}`);
    assert(
      actual === 'Internal Server Error',
      `expected "Internal Server Error" from /compile but got "${actual}"`
    );
  });

  it('should return error if auth throws', async () => {
    compiler.setAuthError(new AuthError('invalid token'));

    const { address, port } = server.address() as net.AddressInfo;
    const options: http.RequestOptions = {
      hostname: address,
      port,
      path: '/compile',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };
    const body = Buffer.from(
      JSON.stringify({
        code: {},
        data: {},
      })
    );
    const res = await makeRequest(options, body);
    const actual = res.body.toString();
    assert(res.statusCode === 401, `expected 401 but got ${res.statusCode}`);
    assert(
      actual === 'Unauthorized',
      `expected "Unauthorized" from /compile but got "${actual}"`
    );
  });

  it('should return error if validate throws', async () => {
    compiler.setValidateError(new InvalidArgumentError('invalid code'));

    const { address, port } = server.address() as net.AddressInfo;
    const options: http.RequestOptions = {
      hostname: address,
      port,
      path: '/compile',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };
    const body = Buffer.from(
      JSON.stringify({
        code: {},
        data: {},
      })
    );
    const res = await makeRequest(options, body);
    const actual = res.body.toString();
    assert(res.statusCode === 400, `expected 400 but got ${res.statusCode}`);
    assert(
      actual === 'invalid code',
      `expected "invalid code" from /compile but got "${actual}"`
    );
  });
});
