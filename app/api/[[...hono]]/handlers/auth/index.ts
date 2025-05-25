import {
  authGoogleHandler,
  authGoogleCallbackHandler,
  authUserHandler,
  authLogoutHandler,
} from '@/app/api/[[...hono]]/handlers/auth/google';
import { initOidcAuthEnv } from '@/app/api/[[...hono]]/middleware/initOidcAuthEnv';

import { Hono } from 'hono';

const app = new Hono()
  .use('*', initOidcAuthEnv)
  .get('/google', ...authGoogleHandler)
  .get('/google/callback', ...authGoogleCallbackHandler)
  .get('/user', ...authUserHandler)
  .post('/logout', ...authLogoutHandler);

export default app;
