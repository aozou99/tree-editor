import { users } from '@/db/schema';
import { getAuth } from '@hono/oidc-auth';
import { eq } from 'drizzle-orm';
import type { Context } from 'hono';

export const getAuthUser = async (c: Context) => {
    const auth = await getAuth(c);
    if (!auth) {
        return null;
    }
    const user = await c.var.DB.query.users.findFirst({
        where: eq(users.providerId, auth.sub),
        columns: {
            id: true,
            name: true,
            icon: true,
        },
    });
    return user ?? null;
};
