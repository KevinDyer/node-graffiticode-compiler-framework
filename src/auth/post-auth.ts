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

export interface ValidateTokenPayload {
  jwt: string;
  lang: string;
}

export interface CountPayload {
  jwt: string;
  lang: string;
  count: number;
}

export interface PostAuthRequest {
  path: string;
  data: ValidateTokenPayload | CountPayload;
}

export interface PostAuthResponse {
  address: string;
  access: string;
}

export interface PostAuthFunction {
  (req: PostAuthRequest): Promise<PostAuthResponse>;
}

export interface BuildPostAuthRequest {
  bent: Function;
  baseUrl: string;
}

export function buildPostAuth(
  buildReq: BuildPostAuthRequest
): PostAuthFunction {
  const authCall = buildReq.bent(buildReq.baseUrl, 'POST', 'json');
  return async function postAuth(
    req: PostAuthRequest
  ): Promise<PostAuthResponse> {
    return (await authCall(req.path, req.data)) as PostAuthResponse;
  };
}
