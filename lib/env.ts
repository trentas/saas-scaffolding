import { z } from 'zod';

/**
 * Environment variable validation (Factor 4: Configuration).
 *
 * Validates all env vars on first import with fail-fast behavior.
 * Import `env` instead of using `process.env` directly.
 */

const envSchema = z.object({
  // --- Supabase (required) ---
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // --- Auth (required) ---
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(1),

  // --- Google OAuth (optional) ---
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // --- JWT (optional, fallbacks in code) ---
  JWT_SECRET: z.string().optional(),
  JWT_ISSUER: z.string().default('saas-scaffolding'),
  JWT_AUDIENCE: z.string().default('microservices'),

  // --- Stripe (optional — billing disabled without these) ---
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRO_PRICE_ID: z.string().optional(),
  STRIPE_ENTERPRISE_PRICE_ID: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),

  // --- Email ---
  RESEND_API_KEY: z.string().default('re_dummy_key_for_build'),
  EMAIL_FROM: z.string().min(1),

  // --- App ---
  NEXT_PUBLIC_APP_NAME: z.string().default('SaaS Scaffolding'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_DEFAULT_LOGO_URL: z.string().default('/logo.svg'),

  // --- Debug ---
  DEBUG_LEVEL: z.enum(['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE']).optional(),

  // --- System ---
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.issues.map(
      (issue) => `  ${issue.path.join('.')}: ${issue.message}`
    );
    console.error(
      `\n❌ Invalid environment variables:\n${errors.join('\n')}\n`
    );
    // Don't crash during build (Next.js evaluates modules at build time)
    if (process.env.npm_lifecycle_event === 'build') {
      return envSchema.parse({
        ...process.env,
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder',
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder',
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'placeholder',
        EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@example.com',
      });
    }
    throw new Error('Environment validation failed. See errors above.');
  }

  return result.data;
}

export const env = validateEnv();
