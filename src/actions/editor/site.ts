
'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  getDocs,
  Timestamp,
  deleteDoc,
  query,
  where,
  writeBatch,
  limit,
} from 'firebase/firestore';
import { logErrorToFirestore } from '../logging';
import type { CanvasElementData } from '@/lib/schemas';
import { convertJsonToJsx } from '@/lib/json-to-jsx';
import { cookies } from 'next/headers';
import { normalizeUrl } from '@/lib/url-utils';

// Define a type for a Site, which can be extended as needed.
export interface Site {
  id: string;
  siteId: string;
  name: string;
  logoUrl?: string;
  description?: string;
  socialProfiles?: { platformName: string; url: string; }[];
  contactEmail?: { value: string; }[];
  contactPhone?: { value: string; }[];
  elements: CanvasElementData[];
  reactComponent?: string;
  type: 'editor' | 'ai' | 'html' | 'template';
  createdAt?: string | null;
  updatedAt?: string | null;
}


export async function createSite(type: Site['type'] = 'editor') {
  const siteId = cookies().get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };

  try {
    const docRef = await addDoc(collection(db, 'sites'), {
      siteId: siteId,
      name: 'New Site',
      elements: [],
      type: type,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error: any) {
    await logErrorToFirestore({
        message: `Failed to create site: ${error.message}`,
        stack: error.stack,
        source: 'createSite',
    });
    return { success: false, error: 'Failed to create site. An error has been logged.' };
  }
}

export async function saveSite(id: string, data: Partial<Omit<Site, 'id' | 'siteId'>>) {
  const siteId = cookies().get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };
  
  try {
    const siteRef = doc(db, 'sites', id);
    const siteSnap = await getDoc(siteRef);
    if (!siteSnap.exists() || siteSnap.data().siteId !== siteId) {
        return { success: false, error: 'Unauthorized.' };
    }
    
    let dataToSave: any = { ...data, updatedAt: serverTimestamp() };

    // If elements are being updated, also regenerate the reactComponent
    if (data.elements) {
        dataToSave.reactComponent = await convertJsonToJsx(data.elements);
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
    return { success: true, id };
  } catch (error: any) {
    await logErrorToFirestore({
        message: `Failed to save site ${id}: ${error.message}`,
        stack: error.stack,
        source: 'saveSite',
    });
    return { success: false, error: `Failed to save site ${id}. An error has been logged.` };
  }
}

export async function getSite(id: string): Promise<{ success: boolean, site?: Site, error?: string }> {
    const siteId = cookies().get('siteId')?.value;
    if (!siteId) return { success: false, error: 'Site ID not found.' };

    try {
        const q = query(
            collection(db, 'sites'),
            where('__name__', '==', id),
            where('siteId', '==', siteId),
            limit(1)
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return { success: false, error: 'Site not found or you do not have permission to access it.' };
        }
        
        const docSnap = querySnapshot.docs[0];
        const data = docSnap.data();
        
        const createdAt = data.createdAt;
        const updatedAt = data.updatedAt;

        const site: Site = {
          id: docSnap.id,
          siteId: data.siteId,
          name: data.name || '',
          logoUrl: data.logoUrl,
          description: data.description,
          socialProfiles: data.socialProfiles || [],
          contactEmail: data.contactEmail || [],
          contactPhone: data.contactPhone || [],
          elements: data.elements || [],
          reactComponent: data.reactComponent,
          type: data.type || 'editor',
          createdAt: createdAt instanceof Timestamp ? createdAt.toDate().toISOString() : null,
          updatedAt: updatedAt instanceof Timestamp ? updatedAt.toDate().toISOString() : null,
        }

        return { success: true, site };

    } catch (error: any) {
        await logErrorToFirestore({
            message: `Failed to fetch site with ID ${id}: ${error.message}`,
            stack: error.stack,
            source: 'getSite',
        });
        return { success: false, error: 'Failed to fetch site. An error has been logged.' };
    }
}

/**
 * Fetches all sites from Firestore for the current siteId.
 */
export async function getSites(): Promise<{ success: boolean, sites?: Site[], error?: string }> {
  const siteId = cookies().get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };

  try {
    const q = query(collection(db, 'sites'), where('siteId', '==', siteId));
    const querySnapshot = await getDocs(q);
    const sites = querySnapshot.docs.map(doc => {
      const data = doc.data();
      const createdAt = data.createdAt;
      const updatedAt = data.updatedAt;
      
      return {
        id: doc.id,
        siteId: data.siteId,
        name: data.name || '',
        logoUrl: data.logoUrl,
        description: data.description,
        socialProfiles: data.socialProfiles || [],
        contactEmail: data.contactEmail || [],
        contactPhone: data.contactPhone || [],
        elements: data.elements,
        reactComponent: data.reactComponent,
        type: data.type || 'editor',
        createdAt: createdAt instanceof Timestamp ? createdAt.toDate().toISOString() : null,
        updatedAt: updatedAt instanceof Timestamp ? updatedAt.toDate().toISOString() : null,
      } as Site;
    });
    return { success: true, sites };
  } catch (error: any) {
    await logErrorToFirestore({
        message: `Failed to fetch sites: ${error.message}`,
        stack: error.stack,
        source: 'getSites',
    });
    return { success: false, error: 'Failed to fetch sites. An error has been logged.' };
  }
}


/**
 * Deletes a site and its associated paths from Firestore.
 * @param id The ID of the site to delete.
 */
export async function deleteSite(id: string) {
  const siteId = cookies().get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };

  try {
    const batch = writeBatch(db);

    const siteRef = doc(db, 'sites', id);
    const siteSnap = await getDoc(siteRef);
    if (!siteSnap.exists() || siteSnap.data().siteId !== siteId) {
        return { success: false, error: 'Unauthorized.' };
    }
    batch.delete(siteRef);

    const pathsQuery = query(collection(db, 'paths'), where('pageId', '==', id), where('siteId', '==', siteId));
    const pathsSnapshot = await getDocs(pathsQuery);
    pathsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    return { success: true };
  } catch (error: any) {
    await logErrorToFirestore({
        message: `Failed to delete site with ID ${id}: ${error.message}`,
        stack: error.stack,
        source: 'deleteSite',
    });
    return { success: false, error: `Failed to delete site with ID ${id}. An error has been logged.` };
  }
}
