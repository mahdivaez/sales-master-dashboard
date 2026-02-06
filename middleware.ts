import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get('auth_token');
  const { pathname } = request.nextUrl;

  // Allow access to login page and auth APIs
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
    if (authToken && pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Redirect root to dashboard (which will then trigger auth check)
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Protect all other dashboard and report routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/reports') || pathname.startsWith('/api')) {
    if (!authToken) {
      // For API routes, return 401
      if (pathname.startsWith('/api')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      // For pages, redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/reports/:path*',
    '/api/:path*',
    '/login',
  ],
};
