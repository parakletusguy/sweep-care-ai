import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function safeNextPath(value: string | null) {
  return value?.startsWith('/') && !value.startsWith('//') && !value.includes('\\') ? value : '/dashboard';
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = safeNextPath(requestUrl.searchParams.get('next'));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { error: invitationError } = await supabase.rpc('sweep_accept_invitations');
      if (invitationError) return NextResponse.redirect(new URL('/login?error=invitation-failed', requestUrl.origin));
      const { data: memberships, error: memberError } = await supabase.from('sweep_memberships').select('id').eq('is_active', true).limit(1);
      if (memberError) return NextResponse.redirect(new URL('/login?error=access-unavailable', requestUrl.origin));
      if (!memberships?.length) return NextResponse.redirect(new URL('/onboarding', requestUrl.origin));
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  return NextResponse.redirect(new URL('/login?error=link-expired', requestUrl.origin));
}
