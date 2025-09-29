
'use server';

import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import { logErrorToFirestore } from '../logging';
import type { CanvasElementData } from '@/lib/schemas';


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

export async function getSite(id: string): Promise<{ success: boolean, elements?: CanvasElementData[], error?: string }> {
    try {
        const docRef = doc(db, 'sites', id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return { success: false, error: 'Site not found.' };
        }

        const data = docSnap.data();
        return { success: true, elements: data.elements as CanvasElementData[] };

    } catch (error: any) {
        console.error(`Failed to fetch site with ID ${id}:`, error);
        await logErrorToFirestore({
            message: `Failed to fetch site with ID ${id}: ` + error.message,
            stack: error.stack,
        });
        return { success: false, error: error.message || 'Failed to fetch site.' };
    }
}
