import { NextResponse } from 'next/server';
import { prisma as db } from '#/core/database/prisma';
import { logger } from '#/logica/logger';

export async function requireProject(request: Request) {
  const projectId = request.headers.get('x-selected-project')?.trim();
  if (!projectId) {
    return NextResponse.json(
      { success: false, error: 'Project ID is required. Pass it in the x-selected-project header.' },
      { status: 400 },
    );
  }

  const project = await db.asset.findUnique({ where: { id: projectId }, select: { id: true } });
  if (!project) {
    return NextResponse.json({ success: false, error: 'Invalid project ID. Project not found.' }, { status: 404 });
  }

  return null;
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
