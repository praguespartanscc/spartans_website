import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { sameOrigin } from '@/lib/request';

export const dynamic = 'force-dynamic';

// Admin and committee screens call this after a save, so the public pages show the change
// at once instead of when their cache next expires (up to an hour for the sitemap).
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in first' }, { status: 401 });
  if (user.app_metadata?.isAdmin !== true) {
    const { data: committee } = await supabase.rpc('is_committee');
    if (committee !== true) return NextResponse.json({ error: 'Admins only' }, { status: 403 });
  }
  // Every page in both languages, plus the sitemap.
  revalidatePath('/', 'layout');
  revalidatePath('/sitemap.xml');
  return NextResponse.json({ ok: true, at: new Date().toISOString() });
}
