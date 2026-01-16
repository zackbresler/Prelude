import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().default('file:./data/prelude.db'),
  SESSION_SECRET: z.string().min(32).default('change-this-to-a-random-secret-at-least-32-chars'),
  SESSION_MAX_AGE: z.coerce.number().default(604800000), // 7 days
  ALLOW_REGISTRATION: z.coerce.boolean().default(false),
  REQUIRE_APPROVAL: z.coerce.boolean().default(false),
  ADMIN_EMAIL: z.string().email().default('admin@example.com'),
  ADMIN_PASSWORD: z.string().min(6).default('changeme'),
  ADMIN_NAME: z.string().default('Administrator'),
  // Cookie secure setting - 'auto' uses HTTPS in production, override if needed
  COOKIE_SECURE: z.enum(['true', 'false', 'auto']).default('auto'),
});

export const config = envSchema.parse(process.env);

export type Config = typeof config;
