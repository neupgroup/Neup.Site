
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 
export function middleware(request: NextRequest) {
  // The authentication logic has been removed.
  // You can add new middleware logic here in the future.
  return NextResponse.next()
}
 
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - landing (public landing page)
     * - preview (public preview pages)
     * - auth (if you re-add an auth page)
     * - any file with a dot (e.g., .png)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|landing|preview|auth|.*\\..*).*)',
  ],
}
