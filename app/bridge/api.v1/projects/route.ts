/*
::neup.documentation::bridge-api-v1-projects
::api GET /bridge/api.v1/projects

Returns every project the authenticated account can access.

::end
*/

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '#/logica/logger';
import { getAssetsForAccount } from '@/services/assets';

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      error: [{ code, message }],
    },
    { status },
  );
}

async function logServerError(error: unknown) {
  if (process.env.NODE_ENV === 'development') {
    console.error('GET /bridge/api.v1/projects failed:', error);
    return;
  }

  await logger.error({
    message: error instanceof Error ? error.message : 'Failed to retrieve projects.',
    stack: error instanceof Error ? error.stack : undefined,
    source: 'GET /bridge/api.v1/projects',
  });
}

export async function GET(request: NextRequest) {
  try {
    const cookieToken = request.cookies.get('auth_account')?.value?.trim() || null;
    const headerToken = request.headers.get('token')?.trim() || null;
    const authToken = cookieToken || headerToken;

    if (!authToken) {
      return errorResponse(
        'projects.missing_token',
        'An authentication token is required.',
        400,
      );
    }

    const result = await getAssetsForAccount(authToken);

    if (result.error) {
      const isUnauthenticated = result.error === 'User account not found.';

      return errorResponse(
        isUnauthenticated ? 'projects.invalid_token' : 'projects.server_error',
        isUnauthenticated ? 'The authentication token is invalid or expired.' : 'Failed to retrieve projects.',
        isUnauthenticated ? 401 : 500,
      );
    }

    return NextResponse.json({
      success: true,
      projects: result.assets ?? [],
    });
  } catch (error) {
    await logServerError(error);
    return errorResponse('projects.server_error', 'Failed to retrieve projects.', 500);
  }
}
