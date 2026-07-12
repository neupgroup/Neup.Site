/**
 * ::neup.documentation::prisma-project-config
 *
 * Configures Prisma CLI commands for this project. Client generation only needs
 * the main datasource URL, so the shadow database URL stays optional and is
 * only passed through when it exists in the environment.
 *
 * ::end
 */
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
  migrations: {
    path: 'prisma/migrations',
  },
});
