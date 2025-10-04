
'use server';

import { getFirestore, doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { cookies } from 'next/headers';
import type { Site } from '@/schemas/site';
import { initializeFirebase } from '@/lib/firebase';

export interface SiteModule {
    active: boolean;
    enabledOn?: string | null;
    expiresOn?: string | null;
}

export interface SiteModules {
    [key: string]: SiteModule;
}

/**
 * Fetches the modules for the current site.
 */
export async function getSiteModules(): Promise<{ success: boolean; modules?: SiteModules; error?: string }> {
  const cookieStore = cookies();
  const siteId = cookieStore.get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };

  try {
    const { firestore } = initializeFirebase();
    const siteRef = doc(firestore, 'sites', siteId);
    const docSnap = await getDoc(siteRef);

    if (!docSnap.exists()) {
      // If the site document doesn't exist, we can't get modules.
      return { success: true, modules: {} };
    }
    
    const data = docSnap.data() as Site;
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
  } catch (error: any) {
    return { success: false, error: 'Failed to fetch site modules.' };
  }
}

/**
 * Updates a specific module's status for the current site.
 */
export async function updateSiteModule(moduleId: string, isActive: boolean): Promise<{ success: boolean; error?: string }> {
  const cookieStore = cookies();
  const siteId = cookieStore.get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };

  try {
    const { firestore } = initializeFirebase();
    const siteRef = doc(firestore, 'sites', siteId);
    const key = `modules.${moduleId}`;
    
    let updateData: any = {
        active: isActive,
    };

    if (isActive) {
        updateData.enabledOn = new Date().toISOString();
        // You can add logic for expiresOn here if needed
        updateData.expiresOn = null;
    }

    await setDoc(siteRef, { 
        modules: {
            [moduleId]: updateData
        }
    }, { merge: true });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'Failed to update module.' };
  }
}
