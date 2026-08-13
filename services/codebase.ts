
'use server';

import { cookies } from 'next/headers';
import { prisma as db } from '@/core/database/prisma';
import { logErrorToDatabase } from '@/logica.logger';
import type { CodeFile } from '@/services/codebase/type';

export async function uploadCodeFile(fileData: Omit<CodeFile, 'id' | 'createdAt' | 'assetId'>) {
  const cookieStore = await cookies();
  const assetId = cookieStore.get('assetId')?.value;
  if (!assetId) return { success: false, error: 'Asset ID not found.' };

  try {
    const record = await db.codeFile.create({
      data: { ...fileData, assetId, createdAt: new Date() },
      select: { id: true },
    });
    return { success: true, id: record.id };
  } catch (error: any) {
    await logErrorToDatabase({ message: `Failed to upload code file: ${error.message}`, source: 'uploadCodeFile' });
    return { success: false, error: error.message || 'Failed to upload file.' };
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
    await logErrorToDatabase({ message: `Failed to get code files: ${error.message}`, source: 'getCodeFiles' });
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
    await logErrorToDatabase({ message: `Failed to delete code file ${id}: ${error.message}`, source: 'deleteCodeFile' });
    return { success: false, error: error.message || 'Failed to delete file.' };
  }
}
