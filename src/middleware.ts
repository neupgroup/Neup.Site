
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 
export function middleware(request: NextRequest) {
  const siteId = request.cookies.get('siteId')?.value

  const { pathname } = request.nextUrl

  // If the user is trying to access the dashboard and doesn't have a siteId,
  // redirect them to the auth page.
  if (!siteId && !pathname.startsWith('/auth')) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    return NextResponse.redirect(url)
  }

  // If the user is authenticated (has a siteId) and tries to visit the auth page,
  // redirect them to the dashboard.
  if (siteId && pathname.startsWith('/auth')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }
 
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
     * - any file with a dot (e.g., .png)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|landing|preview|.*\\..*).*)',
  ],
}
