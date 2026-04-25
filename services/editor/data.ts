
'use server';

import { cookies } from 'next/headers';
import { PageDataSourceBinding } from '@/schemas/data';
import { db } from '@/lib/db';

export async function setPageDataSource(pageId: string, sourceId: string, methodName: string): Promise<{ success: boolean; id?: string; error?: string }> {
  const cookieStore = await cookies();
  const artifactId = cookieStore.get('artifactId')?.value;
  if (!artifactId) return { success: false, error: 'Artifact ID not found.' };

  try {
    const bindingId = `${pageId}_${sourceId}`;
    await db.pageDataSourceBinding.upsert({
      where: { id: bindingId },
      create: { id: bindingId, artifactId, pageId, sourceId, methodName },
      update: { methodName },
    });
    return { success: true, id: bindingId };
  } catch (error: any) {
    return { success: false, error: 'Failed to link data source.' };
  }
}

export async function getPageDataSource(pageId: string): Promise<{ success: boolean; binding?: PageDataSourceBinding; error?: string }> {
  const cookieStore = await cookies();
  const artifactId = cookieStore.get('artifactId')?.value;
  if (!artifactId) return { success: false, error: 'Artifact ID not found.' };

  try {
    const record = await db.pageDataSourceBinding.findFirst({ where: { pageId, artifactId } });
    if (!record) return { success: true, binding: undefined };
    return { success: true, binding: record as unknown as PageDataSourceBinding };
  } catch (error: any) {
    return { success: false, error: 'Failed to fetch data source link.' };
  }
}
