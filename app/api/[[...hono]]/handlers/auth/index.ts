import {
  authGoogleHandler,
  authGoogleCallbackHandler,
} from '@/app/api/[[...hono]]/handlers/auth/google';
import { getAuthUser } from '@/app/api/[[...hono]]/helpers/auth';
import { initOidcAuthEnv } from '@/app/api/[[...hono]]/middleware/initOidcAuthEnv';
import { revokeSession } from '@hono/oidc-auth';

import { Hono } from 'hono';
import { createFactory } from 'hono/factory';

const factory = createFactory();
const authLogoutHandler = factory.createHandlers(async c => {
  await revokeSession(c);
  return c.redirect('/');
});

const authUserHandler = factory.createHandlers(async c => {
  const user = await getAuthUser(c);
  return c.json({
    user,
  });
});

const app = new Hono()
  .use('*', initOidcAuthEnv)
  .get('/google', ...authGoogleHandler)
  .get('/google/callback', ...authGoogleCallbackHandler)
  .get('/user', ...authUserHandler)
  .post('/logout', ...authLogoutHandler);

export default app;
