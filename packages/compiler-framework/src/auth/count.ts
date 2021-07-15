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

import {PostAuthFunction} from './post-auth';

export interface CountRequest {
  token: string;
  lang: string;
  increment: number;
}

export interface CountFunction {
  (req: CountRequest): Promise<void>;
}

export interface BuildCountRequest {
  postAuth: PostAuthFunction;
}

export function buildCount(buildReq: BuildCountRequest): CountFunction {
  return async function count(req: CountRequest): Promise<void> {
    if (req.increment < 1) {
      throw new Error('increment must be greater than zero');
    }
    await buildReq.postAuth({
      path: '/count',
      data: {
        jwt: req.token,
        lang: req.lang,
        count: req.increment,
      },
    });
  };
}
