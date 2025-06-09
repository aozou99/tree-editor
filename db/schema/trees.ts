import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { users } from './users';
import { sql } from 'drizzle-orm';

export const trees = sqliteTable('trees', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  r2Key: text('r2_key').notNull(), // R2 object key
  lastSaved: integer('last_saved', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
}, (table) => {
  return {
    userIdIdx: index('trees_user_id_idx').on(table.userId),
  };
});

// Type definitions for better type safety
export type Tree = typeof trees.$inferSelect;
export type NewTree = typeof trees.$inferInsert;