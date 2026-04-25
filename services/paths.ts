
'use server';

import { cookies } from 'next/headers';
import { db } from '@/core/lib/db';
import { logErrorToDatabase } from '@/core/lib/logging';
import { markStructureAsPending } from './structure';

export interface Path {
  id: string;
  artifactId: string;
  pageId: string;
  path: string;
  createdAt: string | null;
}

/**
 * Creates a new path mapping for a page.
 */
export async function addPath(pageId: string, path: string): Promise<{ success: boolean; id?: string; error?: string }> {
  const cookieStore = await cookies();
  const artifactId = cookieStore.get('artifactId')?.value;
  if (!artifactId) return { success: false, error: 'Artifact ID not found.' };

  if (!path.startsWith('/')) {
    return { success: false, error: 'Path must start with a "/"' };
  }

  try {
    // Check if path already exists for this site
    const existing = await db.pagePath.findFirst({
      where: { artifactId, path },
      select: { id: true },
    });
    if (existing) {
      return { success: false, error: `Path "${path}" is already in use on this site.` };
    }

    const record = await db.pagePath.create({
      data: { artifactId, pageId, path, createdAt: new Date() },
      select: { id: true },
    });

    await markStructureAsPending(artifactId, [path]);

    return { success: true, id: record.id };
  } catch (error: any) {
    await logErrorToDatabase({
      message: `Failed to add path: ${error.message}`,
      stack: error.stack,
      source: 'addPath',
    });
    return { success: false, error: 'Failed to add path. An error has been logged.' };
  }
}

/**
 * Fetches all paths for a specific page.
 */
export async function getPathsForPage(pageId: string): Promise<{ success: boolean; paths?: Path[]; error?: string }> {
  const cookieStore = await cookies();
  const artifactId = cookieStore.get('artifactId')?.value;
  if (!artifactId) return { success: false, error: 'Artifact ID not found.' };

  try {
    const records = await db.pagePath.findMany({
      where: { artifactId, pageId },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    });
    const paths = records.map((record) => ({
      id: record.id,
      artifactId: record.artifactId,
      pageId: record.pageId,
      path: record.path,
      createdAt: record.createdAt ? record.createdAt.toISOString() : null,
    })) as Path[];
    return { success: true, paths };
  } catch (error: any) {
    await logErrorToDatabase({
      message: `Failed to fetch paths for page ${pageId}: ${error.message}`,
      stack: error.stack,
      source: 'getPathsForPage',
    });
    return { success: false, error: 'Failed to fetch paths. An error has been logged.' };
  }
}

/**
 * Deletes a path mapping.
 */
export async function deletePath(id: string): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies();
  const artifactId = cookieStore.get('artifactId')?.value;
  if (!artifactId) return { success: false, error: 'Artifact ID not found.' };

  try {
    const record = await db.pagePath.findUnique({
      where: { id },
      select: { artifactId: true, path: true },
    });
    if (!record || record.artifactId !== artifactId) {
      return { success: false, error: 'Path not found or unauthorized.' };
    }
    await db.pagePath.delete({ where: { id } });

    await markStructureAsPending(artifactId, [record.path], true);

    return { success: true };
  } catch (error: any) {
    await logErrorToDatabase({
      message: `Failed to delete path ${id}: ${error.message}`,
      stack: error.stack,
      source: 'deletePath',
    });
    return { success: false, error: 'Failed to delete path. An error has been logged.' };
  }
}
