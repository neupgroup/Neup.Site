
'use server';

import { cookies } from 'next/headers';
import { prisma as db } from '@/core/database/prisma';
import { logErrorToDatabase } from '@/core/lib/logging';
import { markStructureAsPending } from './structure';

export interface Path {
  id: string;
  assetId: string;
  pageId: string;
  path: string;
  createdAt: string | null;
}

/**
 * Creates a new path mapping for a page.
 */
export async function addPath(pageId: string, path: string): Promise<{ success: boolean; id?: string; error?: string }> {
  const cookieStore = await cookies();
  const assetId = cookieStore.get('assetId')?.value;
  if (!assetId) return { success: false, error: 'Asset ID not found.' };

  if (!path.startsWith('/')) {
    return { success: false, error: 'Path must start with a "/"' };
  }

  try {
    // Check if path already exists for this site
    const existing = await db.pagePath.findFirst({
      where: { assetId, path },
      select: { id: true },
    });
    if (existing) {
      return { success: false, error: `Path "${path}" is already in use on this site.` };
    }

    const record = await db.pagePath.create({
      data: { assetId, pageId, path, createdAt: new Date() },
      select: { id: true },
    });

    await markStructureAsPending(assetId, [path]);

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
  const assetId = cookieStore.get('assetId')?.value;
  if (!assetId) return { success: false, error: 'Asset ID not found.' };

  try {
    const records = await db.pagePath.findMany({
      where: { assetId, pageId },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    });
    const paths = records.map((record) => ({
      id: record.id,
      assetId: record.assetId,
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
  const assetId = cookieStore.get('assetId')?.value;
  if (!assetId) return { success: false, error: 'Asset ID not found.' };

  try {
    const record = await db.pagePath.findUnique({
      where: { id },
      select: { assetId: true, path: true },
    });
    if (!record || record.assetId !== assetId) {
      return { success: false, error: 'Path not found or unauthorized.' };
    }
    await db.pagePath.delete({ where: { id } });

    await markStructureAsPending(assetId, [record.path], true);

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
