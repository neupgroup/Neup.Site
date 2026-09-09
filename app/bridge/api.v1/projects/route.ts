/*
::neup.documentation::bridge-api-v1-projects
::api GET /bridge/api.v1/projects

Returns every project the authenticated account can access.

::end
*/

import { NextRequest, NextResponse } from 'next/server';

import { getAssetsForAccount } from '@/services/assets';

export async function GET(request: NextRequest) {
  try {
    const cookieToken = request.cookies.get('auth_account')?.value?.trim() || null;
    const headerToken = request.headers.get('token')?.trim() || null;
    const result = await getAssetsForAccount(cookieToken || headerToken);

    if (result.error) {
      const isUnauthenticated = result.error === 'User account not found.';

      return NextResponse.json(
        { success: false, error: result.error },
        { status: isUnauthenticated ? 401 : 500 },
      );
    }

    return NextResponse.json({
      success: true,
      projects: result.assets ?? [],
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Authenticated account not found.' },
      { status: 401 },
    );
  }
}
