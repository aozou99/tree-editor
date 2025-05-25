import {
  type IDToken,
  type OidcAuth,
  type TokenEndpointResponses,
  getAuth,
  oidcAuthMiddleware,
  processOAuthCallback,
  revokeSession,
} from '@hono/oidc-auth';
import { eq } from 'drizzle-orm';
import type { Context, OidcAuthClaims } from 'hono';
import { createFactory } from 'hono/factory';
import { getAuthUser } from '../../helpers/auth';
import { users } from '@/db/schema';

declare module 'hono' {
  interface OidcAuthClaims {
    name: string;
    sub: string;
    picture: string;
  }
}

const factory = createFactory();
const oidcClaimsHook = async (
  orig: OidcAuth | undefined,
  claims: IDToken | undefined,
  _response: TokenEndpointResponses
): Promise<OidcAuthClaims> => {
  return {
    name: (claims?.name as string) ?? orig?.name ?? '',
    sub: claims?.sub ?? orig?.sub ?? '',
    picture: (claims?.picture as string) ?? orig?.picture ?? '',
  };
};

export const authGoogleHandler = factory.createHandlers(oidcAuthMiddleware(), async c => {
  await makeUserIfNotExist(c);
  return c.redirect('/');
});

export const authGoogleCallbackHandler = factory.createHandlers(async c => {
  c.set('oidcClaimsHook', oidcClaimsHook);
  return processOAuthCallback(c);
});

export const authLogoutHandler = factory.createHandlers(async c => {
  await revokeSession(c);
  return c.redirect('/');
});

export const authUserHandler = factory.createHandlers(async c => {
  const user = await getAuthUser(c);
  return c.json({
    user,
  });
});

const makeUserIfNotExist = async (c: Context) => {
  const auth = await getAuth(c);
  if (!auth) {
    return null;
  }
  const user = await c.var.DB.query.users.findFirst({
    where: eq(users.providerId, auth.sub ?? ''),
  });
  if (user) {
    return user;
  }
  console.log('Creating new user', auth);
  const newUser = await c.var.DB.insert(users)
    .values({
      provider: 'google',
      providerId: auth.sub,
      name: auth.name,
      icon: auth.picture,
    })
    .returning()
    .execute();
  return newUser.length > 0 ? newUser[0] : null;
};
