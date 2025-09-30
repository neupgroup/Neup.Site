
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
} from 'firebase/firestore';
import { logErrorToFirestore } from '../logging';
import type { CanvasElementData } from '@/lib/schemas';

// Define a type for a Site, which can be extended as needed.
export interface Site {
  id: string;
  elements: CanvasElementData[];
  createdAt?: string | null;
  updatedAt?: string | null;
}


export async function createSite() {
  try {
    const docRef = await addDoc(collection(db, 'sites'), {
      elements: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error('Failed to create site:', error);
    await logErrorToFirestore({
      message: 'Failed to create site: ' + error.message,
      stack: error.stack,
    });
    return { success: false, error: error.message || 'Failed to create site.' };
  }
}

export async function saveSite(id: string, elements: any) {
  try {
    const siteRef = doc(db, 'sites', id);
    await setDoc(siteRef, {
      elements,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return { success: true, id };
  } catch (error: any) {
    console.error(`Failed to save site ${id}:`, error);
    await logErrorToFirestore({
      message: `Failed to save site ${id}: ` + error.message,
      stack: error.stack,
    });
    return { success: false, error: error.message || `Failed to save site ${id}.` };
  }
}

export async function getSite(id: string): Promise<{ success: boolean, site?: Site, error?: string }> {
    try {
        const docRef = doc(db, 'sites', id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return { success: false, error: 'Site not found.' };
        }

        const data = docSnap.data();
        const createdAt = data.createdAt;
        const updatedAt = data.updatedAt;

        const site: Site = {
          id: docSnap.id,
          elements: data.elements || [],
          createdAt: createdAt instanceof Timestamp ? createdAt.toDate().toISOString() : null,
          updatedAt: updatedAt instanceof Timestamp ? updatedAt.toDate().toISOString() : null,
        }

        return { success: true, site };

    } catch (error: any) {
        console.error(`Failed to fetch site with ID ${id}:`, error);
        await logErrorToFirestore({
            message: `Failed to fetch site with ID ${id}: ` + error.message,
            stack: error.stack,
        });
        return { success: false, error: error.message || 'Failed to fetch site.' };
    }
}

/**
 * Fetches all sites from Firestore.
 */
export async function getSites(): Promise<{ success: boolean, sites?: Site[], error?: string }> {
  try {
    const querySnapshot = await getDocs(collection(db, 'sites'));
    const sites = querySnapshot.docs.map(doc => {
      const data = doc.data();
      const createdAt = data.createdAt;
      const updatedAt = data.updatedAt;
      
      return {
        id: doc.id,
        elements: data.elements,
        createdAt: createdAt instanceof Timestamp ? createdAt.toDate().toISOString() : null,
        updatedAt: updatedAt instanceof Timestamp ? updatedAt.toDate().toISOString() : null,
      } as Site;
    });
    return { success: true, sites };
  } catch (error: any) {
    console.error('Failed to fetch sites:', error);
    await logErrorToFirestore({
      message: 'Failed to fetch sites: ' + error.message,
      stack: error.stack,
    });
    return { success: false, error: error.message || 'Failed to fetch sites.' };
  }
}
