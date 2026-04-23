
'use server';

import { getFirestore, doc, getDoc, setDoc, Timestamp } from '@/lib/firestore';
import { cookies } from 'next/headers';
import type { Artifact } from '@/schemas/artifact';
import { getDataStore } from '@/lib/data-store';
import { logErrorToDatabase } from '@/lib/logging';

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
    const { firestore } = getDataStore();
    const artifactRef = doc(firestore, 'artifacts', artifactId);
    const docSnap = await getDoc(artifactRef);

    if (!docSnap.exists()) {
      // If the artifact document doesn't exist, we can't get modules.
      return { success: true, modules: {} };
    }

    const data = docSnap.data() as Artifact;
    const modules = (data as any).modules || {};

    // Ensure date fields are serialized correctly
    for (const key in modules) {
      if (modules[key].enabledOn instanceof Timestamp) {
        modules[key].enabledOn = modules[key].enabledOn.toDate().toISOString();
      }
      if (modules[key].expiresOn instanceof Timestamp) {
        modules[key].expiresOn = modules[key].expiresOn.toDate().toISOString();
      }
    }

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
    const { firestore } = getDataStore();
    const artifactRef = doc(firestore, 'artifacts', artifactId);

    let updateData: any = {
      active: isActive,
    };

    if (isActive) {
      updateData.enabledOn = new Date().toISOString();
      // You can add logic for expiresOn here if needed
      updateData.expiresOn = null;
    }

    await setDoc(artifactRef, {
      modules: {
        [moduleId]: updateData
      }
    }, { merge: true });

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
