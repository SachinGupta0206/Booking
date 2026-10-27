import 'dotenv/config';
import { z } from 'zod';

// Validate environment variables once at startup. If anything is missing or
// malformed the app fails fast with a clear message instead of crashing later.
const envSchema = z.object({
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  FRONTEND_URL: z.string().url('FRONTEND_URL must be a valid URL'),
  PORT: z.coerce.number().int().positive().default(4000),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
