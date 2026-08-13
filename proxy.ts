import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { logica } from '@/logica'

 
export function proxy(request: NextRequest) {

  logica.logger.data({
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
  }).log();


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
