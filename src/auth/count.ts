import { PostAuthFunction } from './post-auth';

export interface CountRequest {
  token: string;
  lang: string;
  increment: number;
}

export interface CountResponse {}

export interface CountFunction {
  (req: CountRequest): Promise<CountResponse>;
}

export interface BuildCountRequest {
  postAuth: PostAuthFunction;
}

export function buildCount(buildReq: BuildCountRequest): CountFunction {
  return async function count(req: CountRequest): Promise<CountResponse> {
    if (req.increment < 1) {
      throw new Error('increment must be greater than zero');
    }
    return buildReq.postAuth({
      path: '/count',
      data: {
        jwt: req.token,
        lang: req.lang,
        count: req.increment,
      },
    });
  };
}
