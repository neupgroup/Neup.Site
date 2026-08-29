import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { logica } from '#/logica'
import baseJson from '#/logica/base.json'
import { decodeNeupIdToken } from '#/logica/account/token/verify'

const AUTH_ME_PATH = '/bridge/api.v1/auth/me'
const SELECTED_PROJECT_QUERY_PARAM = 'selectedProject'

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

  const tokenPayload = decodeNeupIdToken(authAccountToken)
  const isGuestToken = tokenPayload?.guest === true || tokenPayload?.guest === 1

  if (isGuestToken) {
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

    const body = await response.json().catch(() => null) as {
      success?: boolean
      profile?: {
        accountType?: string | null
      } | null
    } | null

    const accountType = body?.profile?.accountType?.trim().toLowerCase()

    if (accountType === 'guest') {
      return false
    }

    return body?.success === true
  } catch {
    return false
  }
}

function getSelectedProjectFromUrl(value: string): string | null {
  try {
    const projectId = new URL(value).searchParams.get(SELECTED_PROJECT_QUERY_PARAM)?.trim()
    return projectId || null
  } catch {
    return null
  }
}

 
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

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

  const selectedProject =
    request.nextUrl.searchParams.get(SELECTED_PROJECT_QUERY_PARAM)?.trim() ||
    getSelectedProjectFromUrl(request.headers.get('referer') || '')

  if (!selectedProject && !pathname.startsWith('/switch')) {
    const url = request.nextUrl.clone()
    url.pathname = '/switch'
    url.search = ''
    url.searchParams.set('returnTo', `${pathname}${search}`)
    return NextResponse.redirect(url)
  }

  if (selectedProject) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-selected-project', selectedProject)
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }
 
  return NextResponse.next()
}
 
export const config = {
  matcher: [
    '/((?!api|bridge|_next/static|_next/image|favicon.ico|landing|preview|auth|.*\\..*).*)',
  ],
}
