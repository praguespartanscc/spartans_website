import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that need a signed-in admin
const adminRoutes = ['/admin'];
// Routes only for signed-out visitors
const authRoutes = ['/login'];

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

  if (matches(pathname, adminRoutes)) {
    if (!user) {
      return NextResponse.redirect(new URL('/login?redirect=/admin', req.url));
    }
    // app_metadata can only be set server-side, so users cannot grant themselves admin.
    if (user.app_metadata?.isAdmin !== true) {
      return NextResponse.redirect(new URL('/not-admin', req.url));
    }
  }

  if (matches(pathname, authRoutes) && user) {
    return NextResponse.redirect(new URL('/admin', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/admin/:path*', '/login', '/auth/callback'],
};
