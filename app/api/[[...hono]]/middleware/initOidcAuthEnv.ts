import { initOidcAuthMiddleware } from '@hono/oidc-auth';
import { createMiddleware } from 'hono/factory';

export const initOidcAuthEnv = createMiddleware(async (c, next) => {
  const {
    OIDC_AUTH_SECRET,
    OIDC_CLIENT_ID,
    OIDC_CLIENT_SECRET,
    OIDC_ISSUER,
    OIDC_REDIRECT_URI,
    OIDC_SCOPES,
  } = c.var.env;
  const middleware = initOidcAuthMiddleware({
    OIDC_AUTH_SECRET,
    OIDC_CLIENT_ID,
    OIDC_CLIENT_SECRET,
    OIDC_ISSUER,
    OIDC_REDIRECT_URI,
    OIDC_SCOPES,
  });
  return middleware(c, next);
});
