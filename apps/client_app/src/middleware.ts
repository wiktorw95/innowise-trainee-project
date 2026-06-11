import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/app'];
const authRoutes = ['/auth/signin', '/auth/signup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasToken =
    request.cookies.has('refresh_token') || request.cookies.has('access_token');

  if (
    protectedRoutes.some((route) => pathname.startsWith(route)) &&
    !hasToken
  ) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  if (authRoutes.some((route) => pathname.startsWith(route)) && hasToken) {
    return NextResponse.redirect(new URL('/app/profile/me', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
