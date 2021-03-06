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
const {
  AuthError,
  createCloudFunction,
  createLambda,
  createValidateToken,
} = require('../../');

const validateToken = createValidateToken({lang: 'L2'});

exports.compiler = {
  language: 'L2',

  async compile(code, data, config) {
    return null;
  },

  async auth(token) {
    const res = await validateToken({token});
    if (res.access.indexOf('compile') === -1) {
      throw new AuthError('User does not have compile access');
    }
  },

  assetPath: __dirname + '/assets',
};

// This function can be used to serve a lambda function
exports.lambdaHandler = createLambda(this.compiler);

// This function can be used to serve a lambda function
exports.cloudFunctionHandler = createCloudFunction(this.compiler);
