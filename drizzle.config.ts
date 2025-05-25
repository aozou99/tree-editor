import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './lib/schema/index.ts',
    dialect: 'sqlite',
});
