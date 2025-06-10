import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { trees } from './trees';
import { users } from './users';
import { sql } from 'drizzle-orm';

export const shares = sqliteTable('shares', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  treeId: text('tree_id').notNull().references(() => trees.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  shareToken: text('share_token').notNull().unique(), // URLで使用するトークン
  title: text('title').notNull(), // 共有時のタイトル
  description: text('description'), // 共有時の説明
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  expiresAt: integer('expires_at', { mode: 'timestamp' }), // 有効期限（null = 無期限）
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
}, (table) => {
  return {
    shareTokenIdx: index('shares_share_token_idx').on(table.shareToken),
    treeIdIdx: index('shares_tree_id_idx').on(table.treeId),
    userIdIdx: index('shares_user_id_idx').on(table.userId),
  };
});

// Type definitions for better type safety
export type Share = typeof shares.$inferSelect;
export type NewShare = typeof shares.$inferInsert;