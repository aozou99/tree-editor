import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { logger } from 'hono/logger';
import { DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from '@/db/schema';
import authRouter from './handlers/auth';
import { initContext } from '@/app/api/[[...hono]]/middleware/initContext';
import { env } from 'hono/adapter';

declare module 'hono' {
  interface ContextVariableMap {
    DB: DrizzleD1Database<typeof schema>;
    env: CloudflareEnv;
  }
}

const app = new Hono().basePath('/api');
app.use(logger());
app.use(initContext);

const routes = app.route('/auth', authRouter);

export type AppType = typeof routes;

export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
