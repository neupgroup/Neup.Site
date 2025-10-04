
'use server';

import { getAdminDb } from '@/lib/firebase/firebase-admin';
import {
  doc,
  setDoc,
  getDoc,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { logErrorToFirestore } from '../logging';
import { cookies } from 'next/headers';
import { normalizeUrl } from '@/lib/url-utils';
import { Site } from '@/schemas/site';

/**
 * Fetches a single site configuration document.
 * The ID of the document is expected to be the siteId from the cookie.
 */
export async function getSite(): Promise<{ success: boolean, site?: Site, error?: string }> {
    const cookieStore = cookies();
    const siteId = cookieStore.get('siteId')?.value;
    // If there's no siteId, we are likely in a root context. This is not an error.
    // Simply return successfully with no site data.
    if (!siteId) return { success: true, site: undefined };

    try {
        const adminDb = getAdminDb();
        const siteRef = doc(adminDb, 'sites', siteId);
        const docSnap = await getDoc(siteRef);

        if (!docSnap.exists()) {
            // This is not an error, but the site document may not have been created yet.
            // A new one will be created on the first save in the profile page.
            return { success: true, site: undefined };
        }
        
        const data = docSnap.data();
        const createdAt = data.createdAt;
        const updatedAt = data.updatedAt;

        const site: Site = {
          id: docSnap.id,
          name: data.name || '',
          url: data.url,
          tier: data.tier,
          logoUrl: data.logoUrl,
          hideSitename: data.hideSitename || false,
          description: data.description,
          socialProfiles: data.socialProfiles || [],
          contactEmail: data.contactEmail || [],
          contactPhone: data.contactPhone || [],
          modules: data.modules || {},
          theme: data.theme || {},
          createdAt: createdAt instanceof Timestamp ? createdAt.toDate().toISOString() : null,
          updatedAt: updatedAt instanceof Timestamp ? updatedAt.toDate().toISOString() : null,
        }

        return { success: true, site };

    } catch (error: any) {
        await logErrorToFirestore({
            message: `Failed to fetch site config for ${siteId}: ${error.message}`,
            stack: error.stack,
            source: 'getSite',
        });
        return { success: false, error: 'Failed to fetch site configuration. An error has been logged.' };
    }
}


/**
 * Saves or creates a site configuration document.
 * The ID of the document is the siteId from the cookie.
 */
export async function saveSite(data: Partial<Omit<Site, 'id'>>) {
  const cookieStore = cookies();
  const siteId = cookieStore.get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };
  
  try {
    const adminDb = getAdminDb();
    const siteRef = doc(adminDb, 'sites', siteId);
    
    // Check if the document exists to determine if this is a create or update
    const docSnap = await getDoc(siteRef);
    
    let dataToSave: any = { ...data, updatedAt: serverTimestamp() };

    if (!docSnap.exists()) {
      dataToSave.createdAt = serverTimestamp();
    }

    if (data.logoUrl) {
      dataToSave.logoUrl = normalizeUrl(data.logoUrl);
    }

    if (data.socialProfiles) {
      dataToSave.socialProfiles = data.socialProfiles.map(p => ({
        ...p,
        url: normalizeUrl(p.url)
      }));
    }
    
    await setDoc(siteRef, dataToSave, { merge: true });
    return { success: true, id: siteId };
  } catch (error: any) {
    await logErrorToFirestore({
        message: `Failed to save site config for ${siteId}: ${error.message}`,
        stack: error.stack,
        source: 'saveSite',
    });
    return { success: false, error: `Failed to save site config for ${siteId}. An error has been logged.` };
  }
}
