import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { homeFor } from '@/lib/auth';

// Routes that need a signed-in admin
const adminRoutes = ['/admin'];
// Admin screens committee members may also use (each page checks the role itself, and the
// database policies decide what is saved)
const writerRoutes = ['/admin/news', '/admin/achievements'];
// Routes that need any signed-in account (the page itself handles pending approval)
const memberRoutes = ['/dashboard', '/score'];
// Routes only for signed-out visitors
const authRoutes = ['/login'];
// Setting a new password needs a session (from the email link, or a signed-in member)
const passwordRoutes = ['/update-password'];

const matches = (pathname: string, routes: string[]) =>
  routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // getUser() checks the token with Supabase (and refreshes the session cookie),
  // unlike getSession(), which trusts whatever is stored in the cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = req.nextUrl;

  if (matches(pathname, writerRoutes)) {
    if (!user) return NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(pathname)}`, req.url));
    if (user.app_metadata?.isAdmin !== true) {
      const { data: committee } = await supabase.rpc('is_committee');
      if (committee !== true) return NextResponse.redirect(new URL('/not-admin', req.url));
    }
  } else if (matches(pathname, adminRoutes)) {
    if (!user) {
      return NextResponse.redirect(new URL('/login?redirect=/admin', req.url));
    }
    // app_metadata can only be set server-side, so users cannot grant themselves admin.
    if (user.app_metadata?.isAdmin !== true) {
      return NextResponse.redirect(new URL('/not-admin', req.url));
    }
  }

  if (matches(pathname, memberRoutes) && !user) {
    return NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(pathname)}`, req.url));
  }

  if (matches(pathname, passwordRoutes) && !user) {
    return NextResponse.redirect(new URL('/reset-password', req.url));
  }

  if (matches(pathname, authRoutes) && user) {
    return NextResponse.redirect(new URL(homeFor(user), req.url));
  }

  return res;
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/score/:path*', '/login', '/update-password', '/auth/callback'],
};
