type SupabasePublicConfig = {
  url: string;
  key: string;
};

/**
 * Returns only browser-safe Supabase configuration. Service-role and database
 * credentials must never be read by a browser client.
 */
export function getSupabasePublicConfig(): SupabasePublicConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Supabase now uses publishable keys. Keep the legacy anon key as a
  // transition path so existing deployments are not broken during rollout.
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      'Supabase configuration is incomplete. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.'
    );
  }

  return { url, key };
}
