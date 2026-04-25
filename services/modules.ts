
'use server';

import { db } from '@/core/lib/db';
import { cookies } from 'next/headers';
import type { Artifact } from '@/schemas/artifact';
import { logErrorToDatabase } from '@/core/lib/logging';

export interface ArtifactModule {
  active: boolean;
  enabledOn?: string | null;
  expiresOn?: string | null;
}

export interface ArtifactModules {
  [key: string]: ArtifactModule;
}

/**
 * Fetches the modules for the current artifact.
 */
export async function getArtifactModules(): Promise<{ success: boolean; modules?: ArtifactModules; error?: string }> {
  const cookieStore = await cookies();
  const artifactId = cookieStore.get('artifactId')?.value;
  if (!artifactId) return { success: false, error: 'Artifact ID not found.' };

  try {
    const record = await db.artifact.findUnique({
      where: { id: artifactId },
      select: { modules: true },
    });

    const modules = (record?.modules as any) || {};
    return { success: true, modules };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to get artifact modules: ${e.message}`, stack: e.stack, source: 'getArtifactModules' });
    return { success: false, error: 'Failed to fetch artifact modules.' };
  }
}

/**
 * Updates a specific module's status for the current artifact.
 */
export async function updateArtifactModule(moduleId: string, isActive: boolean): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies();
  const artifactId = cookieStore.get('artifactId')?.value;
  if (!artifactId) return { success: false, error: 'Artifact ID not found.' };

  try {
    let updateData: any = {
      active: isActive,
    };

    if (isActive) {
      updateData.enabledOn = new Date().toISOString();
      // You can add logic for expiresOn here if needed
      updateData.expiresOn = null;
    }

    const record = await db.artifact.findUnique({
      where: { id: artifactId },
      select: { modules: true },
    });
    const modules = ((record?.modules as any) || {}) as Record<string, unknown>;
    const nextModules = {
      ...modules,
      [moduleId]: updateData,
    };

    await db.artifact.update({
      where: { id: artifactId },
      data: { modules: nextModules as any },
    });

    return { success: true };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to update module ${moduleId}: ${e.message}`, stack: e.stack, source: 'updateArtifactModule' });
    return { success: false, error: 'Failed to update module.' };
  }
}

// Backwards-compatible exports (historically named "site modules").
export type SiteModule = ArtifactModule;
export type SiteModules = ArtifactModules;
export async function getSiteModules() {
  return getArtifactModules();
}
export async function updateSiteModule(moduleId: string, isActive: boolean) {
  return updateArtifactModule(moduleId, isActive);
}
