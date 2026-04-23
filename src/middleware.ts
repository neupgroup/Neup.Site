
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 
export function middleware(request: NextRequest) {
  const artifactId = request.cookies.get('artifactId')?.value

  const { pathname } = request.nextUrl

  // If the user is trying to access the dashboard and doesn't have a artifactId,
  // redirect them to the /switch page.
  if (!artifactId && !pathname.startsWith('/switch')) {
    const url = request.nextUrl.clone()
    url.pathname = '/switch'
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
     * - auth (allow old auth path to be deleted)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|landing|preview|auth|.*\\..*).*)',
  ],
}
