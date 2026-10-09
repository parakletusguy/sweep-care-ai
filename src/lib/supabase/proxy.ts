import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';
import { getSupabasePublicConfig } from './env';

/**
 * Refreshes a Supabase SSR session and verifies its JWT claims. This does not
 * authorize product data by itself; route handlers must still enforce tenant
 * membership and role checks before accessing sensitive records.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, key } = getSupabasePublicConfig();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getClaims verifies the token; getSession only reads an unverified cookie.
  await supabase.auth.getClaims();

  return response;
}
