
'use server';

import { logErrorToDatabase } from '@/core/lib/logging';
import { convertJsonToJsx } from '@/core/lib/json-to-jsx';
import { cookies } from 'next/headers';
import { Page } from '@/schemas/artifact';
import { db } from '@/core/lib/db';
import { getPathsForPage } from '@/services/paths';
import { markStructureAsPending } from '@/services/structure';

export async function createPage(type: Page['type'] = 'editor') {
  const cookieStore = await cookies();
  const artifactId = cookieStore.get('artifactId')?.value;
  if (!artifactId) return { success: false, error: 'Artifact ID not found.' };

  try {
    const record = await db.page.create({
      data: { artifactId, name: 'New Page', elements: [], type, createdAt: new Date(), updatedAt: new Date() },
      select: { id: true },
    });
    return { success: true, id: record.id };
  } catch (error: any) {
    await logErrorToDatabase({ message: `Failed to create page: ${error.message}`, stack: error.stack, source: 'createPage' });
    return { success: false, error: 'Failed to create page. An error has been logged.' };
  }
}

export async function savePage(id: string, data: Partial<Omit<Page, 'id' | 'artifactId'>>) {
  const cookieStore = await cookies();
  const artifactId = cookieStore.get('artifactId')?.value;
  if (!artifactId) return { success: false, error: 'Artifact ID not found.' };

  try {
    const existing = await db.page.findFirst({ where: { id, artifactId } });
    if (!existing) return { success: false, error: 'Unauthorized.' };

    const dataToSave: Record<string, any> = { ...data, updatedAt: new Date() };
    if (data.elements) dataToSave.reactComponent = await convertJsonToJsx(data.elements);

    await db.page.update({ where: { id }, data: dataToSave });

    const { paths } = await getPathsForPage(id);
    if (paths && paths.length > 0) {
      await markStructureAsPending(artifactId, paths.map(p => p.path));
    }

    return { success: true, id };
  } catch (error: any) {
    await logErrorToDatabase({ message: `Failed to save page ${id}: ${error.message}`, stack: error.stack, source: 'savePage' });
    return { success: false, error: `Failed to save page ${id}. An error has been logged.` };
  }
}

export async function getPage(id: string): Promise<{ success: boolean, page?: Page, error?: string }> {
  const cookieStore = await cookies();
  const artifactId = cookieStore.get('artifactId')?.value;
  if (!artifactId) return { success: false, error: 'Artifact ID not found.' };

  try {
    const record = await db.page.findFirst({ where: { id, artifactId } });
    if (!record) return { success: false, error: 'Page not found or you do not have permission to access it.' };

    const page: Page = {
      id: record.id,
      artifactId: record.artifactId,
      name: record.name,
      elements: (record.elements as any) || [],
      reactComponent: record.reactComponent ?? undefined,
      type: (record.type as Page['type']) || 'editor',
      createdAt: record.createdAt ? record.createdAt.toISOString() : null,
      updatedAt: record.updatedAt ? record.updatedAt.toISOString() : null,
    };
    return { success: true, page };
  } catch (error: any) {
    await logErrorToDatabase({ message: `Failed to fetch page with ID ${id}: ${error.message}`, stack: error.stack, source: 'getPage' });
    return { success: false, error: 'Failed to fetch page. An error has been logged.' };
  }
}

export async function getPages(): Promise<{ success: boolean, pages?: Page[], error?: string }> {
  const cookieStore = await cookies();
  const artifactId = cookieStore.get('artifactId')?.value;
  if (!artifactId) return { success: false, error: 'Artifact ID not found.' };

  try {
    const records = await db.page.findMany({ where: { artifactId } });

    const pages = await Promise.all(records.map(async (record) => {
      const { paths: pagePaths } = await getPathsForPage(record.id);
      return {
        id: record.id,
        artifactId: record.artifactId,
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
    await logErrorToDatabase({ message: `Failed to fetch pages: ${error.message}`, stack: error.stack, source: 'getPages' });
    return { success: false, error: 'Failed to fetch pages. An error has been logged.' };
  }
}

export async function deletePage(id: string) {
  const cookieStore = await cookies();
  const artifactId = cookieStore.get('artifactId')?.value;
  if (!artifactId) return { success: false, error: 'Artifact ID not found.' };

  try {
    const existing = await db.page.findFirst({ where: { id, artifactId } });
    if (!existing) return { success: false, error: 'Unauthorized.' };

    const { paths } = await getPathsForPage(id);
    const pathStrings = paths ? paths.map(p => p.path) : [];

    // Cascade deletes paths via FK onDelete: Cascade
    await db.page.delete({ where: { id } });

    if (pathStrings.length > 0) await markStructureAsPending(artifactId, pathStrings, true);

    return { success: true };
  } catch (error: any) {
    await logErrorToDatabase({ message: `Failed to delete page with ID ${id}: ${error.message}`, stack: error.stack, source: 'deletePage' });
    return { success: false, error: `Failed to delete page with ID ${id}. An error has been logged.` };
  }
}
