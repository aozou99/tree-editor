import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './db/schema/index.ts',
  dialect: 'sqlite',
  out: './drizzle',
});
