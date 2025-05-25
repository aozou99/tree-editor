import * as schema from '@/db/schema';
import { drizzle } from 'drizzle-orm/d1';

export const getDB = (db: D1Database) => {
    return drizzle(db, { schema });
};
