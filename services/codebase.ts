
'use server';

import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { logErrorToDatabase } from '@/lib/logging';
import type { CodeFile } from '@/schemas/codebase';

export async function uploadCodeFile(fileData: Omit<CodeFile, 'id' | 'createdAt' | 'artifactId'>) {
  const cookieStore = await cookies();
  const artifactId = cookieStore.get('artifactId')?.value;
  if (!artifactId) return { success: false, error: 'Artifact ID not found.' };

  try {
    const record = await db.codeFile.create({
      data: { ...fileData, artifactId, createdAt: new Date() },
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
  const artifactId = cookieStore.get('artifactId')?.value;
  if (!artifactId) return { success: false, error: 'Artifact ID not found.' };

  try {
    const [totalCount, records] = await Promise.all([
      db.codeFile.count({ where: { artifactId } }),
      db.codeFile.findMany({
        where: { artifactId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const files: CodeFile[] = records.map(r => ({
      id: r.id,
      artifactId: r.artifactId,
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
  const artifactId = cookieStore.get('artifactId')?.value;
  if (!artifactId) return { success: false, error: 'Artifact ID not found.' };

  try {
    const existing = await db.codeFile.findFirst({ where: { id, artifactId } });
    if (!existing) return { success: false, error: 'File not found or unauthorized.' };
    await db.codeFile.delete({ where: { id } });
    return { success: true };
  } catch (error: any) {
    await logErrorToDatabase({ message: `Failed to delete code file ${id}: ${error.message}`, source: 'deleteCodeFile' });
    return { success: false, error: error.message || 'Failed to delete file.' };
  }
}
