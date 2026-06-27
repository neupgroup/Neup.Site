
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 
export function proxy(request: NextRequest) {
  const assetId = request.cookies.get('assetId')?.value

  const { pathname } = request.nextUrl

  if (!assetId && !pathname.startsWith('/switch')) {
    const url = request.nextUrl.clone()
    url.pathname = '/switch'
    return NextResponse.redirect(url)
  }
 
  return NextResponse.next()
}
 
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|landing|preview|auth|.*\\..*).*)',
  ],
}
