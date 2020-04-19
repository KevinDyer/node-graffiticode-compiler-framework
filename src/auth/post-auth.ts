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
