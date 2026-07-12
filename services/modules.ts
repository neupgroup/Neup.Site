
'use server';

import { prisma as db } from '@/core/database/prisma';
import { cookies } from 'next/headers';
import type { Asset } from '@/schemas/asset';
import { logErrorToDatabase } from '@/core/lib/logging';

export interface AssetModule {
  active: boolean;
  enabledOn?: string | null;
  expiresOn?: string | null;
}

export interface AssetModules {
  [key: string]: AssetModule;
}

/**
 * Fetches the modules for the current asset.
 */
export async function getAssetModules(): Promise<{ success: boolean; modules?: AssetModules; error?: string }> {
  const cookieStore = await cookies();
  const assetId = cookieStore.get('assetId')?.value;
  if (!assetId) return { success: false, error: 'Asset ID not found.' };

  try {
    const record = await db.asset.findUnique({
      where: { id: assetId },
      select: { modules: true },
    });

    const modules = (record?.modules as any) || {};
    return { success: true, modules };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to get asset modules: ${e.message}`, stack: e.stack, source: 'getAssetModules' });
    return { success: false, error: 'Failed to fetch asset modules.' };
  }
}

/**
 * Updates a specific module's status for the current asset.
 */
export async function updateAssetModule(moduleId: string, isActive: boolean): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies();
  const assetId = cookieStore.get('assetId')?.value;
  if (!assetId) return { success: false, error: 'Asset ID not found.' };

  try {
    let updateData: any = {
      active: isActive,
    };

    if (isActive) {
      updateData.enabledOn = new Date().toISOString();
      // You can add logic for expiresOn here if needed
      updateData.expiresOn = null;
    }

    const record = await db.asset.findUnique({
      where: { id: assetId },
      select: { modules: true },
    });
    const modules = ((record?.modules as any) || {}) as Record<string, unknown>;
    const nextModules = {
      ...modules,
      [moduleId]: updateData,
    };

    await db.asset.update({
      where: { id: assetId },
      data: { modules: nextModules as any },
    });

    return { success: true };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to update module ${moduleId}: ${e.message}`, stack: e.stack, source: 'updateAssetModule' });
    return { success: false, error: 'Failed to update module.' };
  }
}

// Backwards-compatible exports (historically named "site modules").
export type SiteModule = AssetModule;
export type SiteModules = AssetModules;
export async function getSiteModules() {
  return getAssetModules();
}
export async function updateSiteModule(moduleId: string, isActive: boolean) {
  return updateAssetModule(moduleId, isActive);
}
