import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define routes that require authentication
const protectedRoutes = ['/admin'];
// Define routes that should be accessible only for non-authenticated users
const authRoutes = ['/login'];

export async function middleware(req: NextRequest) {
  // Create a Supabase client configured to use cookies
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  // Refresh session if expired
  await supabase.auth.getSession();
  
  // Get the session again after potential refresh
  const { data: { session } } = await supabase.auth.getSession();
  
  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname === route || req.nextUrl.pathname.startsWith(`${route}/`)
  );
  
  const isAuthRoute = authRoutes.some(route => 
    req.nextUrl.pathname === route || req.nextUrl.pathname.startsWith(`${route}/`)
  );
  
  // Handle protected routes
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/login', req.url);
    return NextResponse.redirect(redirectUrl);
  }
  
  // Handle auth routes (redirect to dashboard if already logged in)
  if (isAuthRoute && session) {
    const redirectUrl = new URL('/admin', req.url);
    return NextResponse.redirect(redirectUrl);
  }
  
  return res;
}

// Define which routes this middleware should run on
export const config = {
  matcher: [
    '/admin/:path*',
    '/login',
    '/auth/callback',
  ],
}; 