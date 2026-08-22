import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { logica } from '@/logica'
import baseJson from '@/logica/base.json'

const AUTH_ME_PATH = '/bridge/api.v1/auth/me'

function createAccountBridgeUrl(path: string): string {
  const basePath = baseJson.neupid.replace(/\/+$/, '')
  const normalizedPath = path.replace(/^\/+/, '')
  return `${basePath}/${normalizedPath}`
}

async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const authAccountToken = request.cookies.get('auth_account')?.value?.trim()

  if (!authAccountToken) {
    return false
  }

  try {
    const response = await fetch(createAccountBridgeUrl(AUTH_ME_PATH), {
      method: 'GET',
      headers: {
        cookie: `auth_account=${encodeURIComponent(authAccountToken)}`,
        'x-auth-account': authAccountToken,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return false
    }

    const body = await response.json().catch(() => null) as { success?: boolean } | null
    return body?.success === true
  } catch {
    return false
  }
}

 
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/bridge/')) {
    return NextResponse.next()
  }

  logica.logger.data({
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
  }).log();

  const authenticated = await isAuthenticated(request)

  if (!authenticated) {
    return NextResponse.redirect(baseJson.neupid)
  }

  const assetId = request.cookies.get('assetId')?.value

  if (!assetId && !pathname.startsWith('/switch')) {
    const url = request.nextUrl.clone()
    url.pathname = '/switch'
    return NextResponse.redirect(url)
  }
 
  return NextResponse.next()
}
 
export const config = {
  matcher: [
    '/((?!api|bridge|_next/static|_next/image|favicon.ico|landing|preview|auth|.*\\..*).*)',
  ],
}
