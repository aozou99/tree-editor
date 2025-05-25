import { getCloudflareContext } from '@opennextjs/cloudflare';
import { drizzle } from 'drizzle-orm/d1';
import { createMiddleware } from 'hono/factory';
import * as schema from '@/db/schema';

export const initContext = createMiddleware(async (c, next) => {
    const { env } = getCloudflareContext();
    c.set('DB', drizzle(env.DB, { schema, logger: false }));
    c.set('env', env);
    await next();
});
