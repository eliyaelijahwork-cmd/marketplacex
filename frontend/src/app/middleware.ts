// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('firebaseToken')?.value;
  const { pathname } = request.nextUrl;

  // Public paths (no auth required)
  const publicPaths = ['/login', '/signup', '/'];
  if (publicPaths.includes(pathname)) return NextResponse.next();

  // Protect dashboard routes
  if (pathname.startsWith('/supplier') || pathname.startsWith('/customer')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  return NextResponse.next();
}