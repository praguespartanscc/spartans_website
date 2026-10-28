import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { homeFor, safeRedirect } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Email confirmation, password reset and Google sign-in links all land here.
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = safeRedirect(requestUrl.searchParams.get('next'));

  if (!code) return NextResponse.redirect(new URL('/login', request.url));

  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    // Expired or already-used link: send them to sign in with a short explanation.
    return NextResponse.redirect(new URL('/login?link=expired', request.url));
  }

  return NextResponse.redirect(new URL(next ?? homeFor(data.user), request.url));
}
