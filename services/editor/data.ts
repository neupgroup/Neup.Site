
'use server';

import { getActiveProjectId } from '@/services/projects';
import { PageDataSourceBinding } from '@/services/data/type';
import { prisma as db } from '@/core/database/prisma';

export async function setPageDataSource(pageId: string, sourceId: string, methodName: string): Promise<{ success: boolean; id?: string; error?: string }> {
  const assetId = await getActiveProjectId();
  if (!assetId) return { success: false, error: 'Asset ID not found.' };

  try {
    const bindingId = `${pageId}_${sourceId}`;
    await db.pageDataSourceBinding.upsert({
      where: { id: bindingId },
      create: { id: bindingId, assetId, pageId, sourceId, methodName },
      update: { methodName },
    });
    return { success: true, id: bindingId };
  } catch (error: any) {
    return { success: false, error: 'Failed to link data source.' };
  }
}

export async function getPageDataSource(pageId: string): Promise<{ success: boolean; binding?: PageDataSourceBinding; error?: string }> {
  const assetId = await getActiveProjectId();
  if (!assetId) return { success: false, error: 'Asset ID not found.' };

  try {
    const record = await db.pageDataSourceBinding.findFirst({ where: { pageId, assetId } });
    if (!record) return { success: true, binding: undefined };
    return { success: true, binding: record as unknown as PageDataSourceBinding };
  } catch (error: any) {
    return { success: false, error: 'Failed to fetch data source link.' };
  }
}
