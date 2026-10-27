import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

// Service-role client: bypasses Row Level Security. SERVER ONLY.
// This module must never be imported by the frontend.
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
