import { createClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client with SERVICE ROLE privileges.
 *
 * IMPORTANT: This client BYPASSES Row Level Security (RLS).
 * Only use this for server-side operations that need elevated privileges,
 * such as creating user records during authentication callbacks.
 *
 * NEVER expose this client to the browser or client-side code.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured');
  }

  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured. Add it to your .env.local file.');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
