import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow access to login page, API auth routes, and static files
  if (pathname === '/login' || 
      pathname.startsWith('/api/auth') ||
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/favicon.ico')) {
    return NextResponse.next()
  }

  // Check for authentication token (simple presence check for now)
  const token = request.cookies.get('auth-token')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // For now, just check if token exists (we'll verify on the server side)
  // This avoids the Edge Runtime crypto issue
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (login page)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|login).*)',
  ],
}
