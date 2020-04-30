import * as bent from 'bent';

import { buildCount } from './count';
import { buildPostAuth } from './post-auth';
import { buildCreateValidateToken } from './validate-token';

const baseUrl = 'https://auth.artcompiler.com';
const postAuth = buildPostAuth({ bent, baseUrl });
const count = buildCount({ postAuth });
const createValidateToken = buildCreateValidateToken({ postAuth, count });

// Exports
export * from './count';
export * from './post-auth';
export * from './validate-token';
export { count, postAuth, createValidateToken };
