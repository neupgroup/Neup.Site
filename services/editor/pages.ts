
'use server';

import { logger } from '@/logica/logger';
import { convertJsonToJsx } from '@/inapp/helpers/json-to-jsx';
import { cookies } from 'next/headers';
import { Page } from '@/services/asset/type';
import { prisma as db } from '@/core/database/prisma';
import { getPathsForPage } from '@/services/paths';
import { markStructureAsPending } from '@/services/structure';

export async function createPage(type: Page['type'] = 'editor') {
  const cookieStore = await cookies();
  const assetId = cookieStore.get('assetId')?.value;
  if (!assetId) return { success: false, error: 'Asset ID not found.' };

  try {
    const record = await db.page.create({
      data: { assetId, name: 'New Page', elements: [], type, createdAt: new Date(), updatedAt: new Date() },
      select: { id: true },
    });
    return { success: true, id: record.id };
  } catch (error: any) {
    await logger.error({ message: `Failed to create page: ${error.message}`, stack: error.stack, source: 'createPage' });
    return { success: false, error: 'Failed to create page. An error has been logged.' };
  }
}

export async function savePage(id: string, data: Partial<Omit<Page, 'id' | 'assetId'>>) {
  const cookieStore = await cookies();
  const assetId = cookieStore.get('assetId')?.value;
  if (!assetId) return { success: false, error: 'Asset ID not found.' };

  try {
    const existing = await db.page.findFirst({ where: { id, assetId } });
    if (!existing) return { success: false, error: 'Unauthorized.' };

    const dataToSave: Record<string, any> = { ...data, updatedAt: new Date() };
    if (data.elements) dataToSave.reactComponent = await convertJsonToJsx(data.elements);

    await db.page.update({ where: { id }, data: dataToSave });

    const { paths } = await getPathsForPage(id);
    if (paths && paths.length > 0) {
      await markStructureAsPending(assetId, paths.map(p => p.path));
    }

    return { success: true, id };
  } catch (error: any) {
    await logger.error({ message: `Failed to save page ${id}: ${error.message}`, stack: error.stack, source: 'savePage' });
    return { success: false, error: `Failed to save page ${id}. An error has been logged.` };
  }
}

export async function getPage(id: string): Promise<{ success: boolean, page?: Page, error?: string }> {
  const cookieStore = await cookies();
  const assetId = cookieStore.get('assetId')?.value;
  if (!assetId) return { success: false, error: 'Asset ID not found.' };

  try {
    const record = await db.page.findFirst({ where: { id, assetId } });
    if (!record) return { success: false, error: 'Page not found or you do not have permission to access it.' };

    const page: Page = {
      id: record.id,
      assetId: record.assetId,
      name: record.name,
      elements: (record.elements as any) || [],
      reactComponent: record.reactComponent ?? undefined,
      type: (record.type as Page['type']) || 'editor',
      createdAt: record.createdAt ? record.createdAt.toISOString() : null,
      updatedAt: record.updatedAt ? record.updatedAt.toISOString() : null,
    };
    return { success: true, page };
  } catch (error: any) {
    await logger.error({ message: `Failed to fetch page with ID ${id}: ${error.message}`, stack: error.stack, source: 'getPage' });
    return { success: false, error: 'Failed to fetch page. An error has been logged.' };
  }
}

export async function getPages(): Promise<{ success: boolean, pages?: Page[], error?: string }> {
  const cookieStore = await cookies();
  const assetId = cookieStore.get('assetId')?.value;
  if (!assetId) return { success: false, error: 'Asset ID not found.' };

  try {
    const records = await db.page.findMany({ where: { assetId } });

    const pages = await Promise.all(records.map(async (record) => {
      const { paths: pagePaths } = await getPathsForPage(record.id);
      return {
        id: record.id,
        assetId: record.assetId,
        name: record.name,
        elements: (record.elements as any) || [],
        reactComponent: record.reactComponent ?? undefined,
        type: (record.type as Page['type']) || 'editor',
        createdAt: record.createdAt ? record.createdAt.toISOString() : null,
        updatedAt: record.updatedAt ? record.updatedAt.toISOString() : null,
        paths: pagePaths || [],
      } as Page;
    }));

    return { success: true, pages };
  } catch (error: any) {
    await logger.error({ message: `Failed to fetch pages: ${error.message}`, stack: error.stack, source: 'getPages' });
    return { success: false, error: 'Failed to fetch pages. An error has been logged.' };
  }
}

export async function deletePage(id: string) {
  const cookieStore = await cookies();
  const assetId = cookieStore.get('assetId')?.value;
  if (!assetId) return { success: false, error: 'Asset ID not found.' };

  try {
    const existing = await db.page.findFirst({ where: { id, assetId } });
    if (!existing) return { success: false, error: 'Unauthorized.' };

    const { paths } = await getPathsForPage(id);
    const pathStrings = paths ? paths.map(p => p.path) : [];

    // Cascade deletes paths via FK onDelete: Cascade
    await db.page.delete({ where: { id } });

    if (pathStrings.length > 0) await markStructureAsPending(assetId, pathStrings, true);

    return { success: true };
  } catch (error: any) {
    await logger.error({ message: `Failed to delete page with ID ${id}: ${error.message}`, stack: error.stack, source: 'deletePage' });
    return { success: false, error: `Failed to delete page with ID ${id}. An error has been logged.` };
  }
}
