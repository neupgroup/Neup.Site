import { NextResponse } from 'next/server';
import { prisma as db } from '#/core/database/prisma';
import { logger } from '#/logica/logger';
import { getAccountId } from '@/services/accounts';

export async function requireProject(request: Request) {
  const projectId = request.headers.get('x-selected-project')?.trim();
  if (!projectId) {
    return NextResponse.json(
      { success: false, error: 'Project ID is required. Pass it in the x-selected-project header.' },
      { status: 400 },
    );
  }

  const token = request.headers.get('token')?.trim() || null;
  let accountId: string;
  try {
    accountId = await getAccountId(token);
  } catch {
    return NextResponse.json({ success: false, error: 'Authentication token is required or invalid.' }, { status: 401 });
  }

  const project = await db.asset.findFirst({
    where: {
      id: projectId,
      OR: [
        { ownerAccountId: accountId },
        { roles: { some: { accountId } } },
      ],
    },
    select: { id: true },
  });
  if (!project) {
    return NextResponse.json({ success: false, error: 'Project not found or the token has no access to it.' }, { status: 403 });
  }

  return { projectId };
}

export async function logApiError(source: string, error: unknown, context?: Record<string, unknown>) {
  const normalized = error instanceof Error ? error : new Error(String(error));
  console.error(`[${source}]`, normalized, context ?? {});
  try {
    await logger.error({ message: normalized.message, name: normalized.name, stack: normalized.stack, source, context });
  } catch (loggingError) {
    console.error(`[${source}] Failed to persist error log.`, loggingError);
  }
}
