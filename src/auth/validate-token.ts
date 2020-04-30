import { CountFunction } from './count';
import { PostAuthFunction } from './post-auth';

export interface ValidateTokenRequest {
  token: string | null;
}

export interface ValidateTokenResponse {
  address: string;
  access: string;
}

export interface ValidateTokenFunction {
  (req: ValidateTokenRequest): Promise<ValidateTokenResponse>;
}

export interface BuildValidateTokenRequest {
  lang: string;
  count: CountFunction;
  postAuth: PostAuthFunction;
}

export function buildValidateToken(
  buildReq: BuildValidateTokenRequest
): ValidateTokenFunction {
  const cache = new Map();
  return async function validateToken(
    req: ValidateTokenRequest
  ): Promise<ValidateTokenResponse> {
    if (!req.token) {
      return {
        address: 'guest',
        access: 'compile',
      };
    }
    if (!cache.has(req.token)) {
      const res = await buildReq.postAuth({
        path: '/validate',
        data: {
          jwt: req.token,
          lang: buildReq.lang,
        },
      });
      cache.set(req.token, res);
    }
    buildReq.count({
      token: req.token,
      lang: buildReq.lang,
      increment: 1,
    });
    return cache.get(req.token);
  };
}

export interface CreateValidateTokenRequest {
  lang: string;
}

export interface CreateValidateTokenFunction {
  (req: CreateValidateTokenRequest): ValidateTokenFunction;
}

export interface BuildCreateValidateTokenRequest {
  postAuth: PostAuthFunction;
  count: CountFunction;
}

export function buildCreateValidateToken(
  buildReq: BuildCreateValidateTokenRequest
): CreateValidateTokenFunction {
  return function createValidateToken(
    req: CreateValidateTokenRequest
  ): ValidateTokenFunction {
    return buildValidateToken({
      postAuth: buildReq.postAuth,
      count: buildReq.count,
      lang: req.lang,
    });
  };
}
