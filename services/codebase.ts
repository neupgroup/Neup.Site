
'use server';

import { cookies } from 'next/headers';
import { prisma as db } from '@/core/database/prisma';
import { logger } from '@/logica/logger';
import type { CodeFile } from '@/services/codebase/type';

function normalizeCodeFilePath(input: string): string | null {
  const trimmed = input.trim().replace(/\\/g, '/').replace(/^\/+/, '');
  if (!trimmed || trimmed.includes('\0')) return null;

  const segments = trimmed.split('/').filter(Boolean);
  if (!segments.length || segments.some((segment) => segment === '.' || segment === '..')) {
    return null;
  }

  return segments.join('/');
}

export async function uploadCodeFile(fileData: Omit<CodeFile, 'id' | 'createdAt' | 'assetId'>) {
  const cookieStore = await cookies();
  const assetId = cookieStore.get('assetId')?.value;
  if (!assetId) return { success: false, error: 'Asset ID not found.' };

  try {
    const normalizedPath = normalizeCodeFilePath(fileData.filePath);
    if (!normalizedPath) return { success: false, error: 'Invalid file path.' };

    const record = await db.codeFile.create({
      data: { ...fileData, assetId, filePath: normalizedPath, createdAt: new Date() },
      select: { id: true },
    });
    return { success: true, id: record.id };
  } catch (error: any) {
    await logger.error({ message: `Failed to upload code file: ${error.message}`, source: 'uploadCodeFile' });
    return { success: false, error: error.message || 'Failed to upload file.' };
  }
}

export async function saveCodeFileByPath(params: {
  filePath: string;
  content: string;
  fileName?: string;
}): Promise<{ success: boolean; id?: string; error?: string; created?: boolean }> {
  const cookieStore = await cookies();
  const assetId = cookieStore.get('assetId')?.value;
  if (!assetId) return { success: false, error: 'Asset ID not found.' };

  const normalizedPath = normalizeCodeFilePath(params.filePath);
  if (!normalizedPath) return { success: false, error: 'Invalid file path.' };

  const fileName = params.fileName?.trim() || normalizedPath.split('/').pop() || normalizedPath;
  const size = Buffer.byteLength(params.content, 'utf-8');
  const encodedContent = Buffer.from(params.content, 'utf-8').toString('base64');

  try {
    const existing = await db.codeFile.findFirst({
      where: { assetId, filePath: normalizedPath },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      await db.codeFile.update({
        where: { id: existing.id },
        data: {
          fileName,
          filePath: normalizedPath,
          content: encodedContent,
          size,
        },
      });

      return { success: true, id: existing.id, created: false };
    }

    const created = await db.codeFile.create({
      data: {
        assetId,
        fileName,
        filePath: normalizedPath,
        content: encodedContent,
        size,
        createdAt: new Date(),
      },
      select: { id: true },
    });

    return { success: true, id: created.id, created: true };
  } catch (error: any) {
    await logger.error({ message: `Failed to save code file at path ${normalizedPath}: ${error.message}`, source: 'saveCodeFileByPath' });
    return { success: false, error: error.message || 'Failed to save file.' };
  }
}

export async function getCodeFiles({ page = 1, pageSize = 10 }: { page?: number, pageSize?: number }): Promise<{ success: boolean; files?: CodeFile[]; error?: string; totalCount?: number }> {
  const cookieStore = await cookies();
  const assetId = cookieStore.get('assetId')?.value;
  if (!assetId) return { success: false, error: 'Asset ID not found.' };

  try {
    const [totalCount, records] = await Promise.all([
      db.codeFile.count({ where: { assetId } }),
      db.codeFile.findMany({
        where: { assetId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const files: CodeFile[] = records.map(r => ({
      id: r.id,
      assetId: r.assetId,
      fileName: r.fileName,
      filePath: r.filePath,
      content: r.content,
      size: r.size,
      createdAt: r.createdAt ? r.createdAt.toISOString() : null,
    } as CodeFile));

    return { success: true, files, totalCount };
  } catch (error: any) {
    await logger.error({ message: `Failed to get code files: ${error.message}`, source: 'getCodeFiles' });
    return { success: false, error: error.message || 'Failed to fetch files.' };
  }
}

export async function deleteCodeFile(id: string) {
  const cookieStore = await cookies();
  const assetId = cookieStore.get('assetId')?.value;
  if (!assetId) return { success: false, error: 'Asset ID not found.' };

  try {
    const existing = await db.codeFile.findFirst({ where: { id, assetId } });
    if (!existing) return { success: false, error: 'File not found or unauthorized.' };
    await db.codeFile.delete({ where: { id } });
    return { success: true };
  } catch (error: any) {
    await logger.error({ message: `Failed to delete code file ${id}: ${error.message}`, source: 'deleteCodeFile' });
    return { success: false, error: error.message || 'Failed to delete file.' };
  }
}
