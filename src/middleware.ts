import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'rocky_session_token';
const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'rocky-business-manager-production-secret-auth-key-2026-super-secure'
);

// Protected routes prefix list
const protectedRoutes = [
  '/dashboard',
  '/projects',
  '/monthly',
  '/carry-forward',
  '/clients',
  '/tasks',
  '/calendar',
  '/revenue',
  '/payments',
  '/expenses',
  '/targets',
  '/invoices',
  '/analytics',
  '/reports',
  '/notifications',
  '/activity',
  '/backup',
  '/settings',
  '/users',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  let isAuthenticated = false;
  let userRole = 'USER';

  if (token) {
    try {
      const { payload } = await jwtVerify(token, SECRET_KEY);
      isAuthenticated = true;
      userRole = (payload.role as string) || 'USER';
    } catch {
      isAuthenticated = false;
    }
  }

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');

  if (isProtected && !isAuthenticated) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', encodeURI(pathname));
    return NextResponse.redirect(url);
  }

  // Master-only protected routes
  if (pathname.startsWith('/users') && userRole !== 'MASTER' && userRole !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (pathname === '/') {
    return NextResponse.redirect(new URL(isAuthenticated ? '/dashboard' : '/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, icons)
     * - api routes (handled individually)
     */
    '/((?!_next/static|_next/image|favicon.ico|images|api/auth).*)',
  ],
};
