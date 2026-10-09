import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getSupabasePublicConfig } from './env';

/**
 * Creates a server-only client used after the requester's identity and tenant
 * membership have been verified. This key must never be imported by client
 * components or exposed through a NEXT_PUBLIC_ environment variable.
 */
export function createAdminClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!secretKey) {
    throw new Error(
      'Secure submission storage is unavailable because SUPABASE_SECRET_KEY is not configured.'
    );
  }

  const { url } = getSupabasePublicConfig();

  return createSupabaseClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
