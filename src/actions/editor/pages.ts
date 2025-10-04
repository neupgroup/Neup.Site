
'use server';

import { getFirestore } from 'firebase/firestore';
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
import { logErrorToFirestore } from '@/lib/logging';
import type { CanvasElementData } from '@/schemas/canvas';
import { convertJsonToJsx } from '@/lib/json-to-jsx';
import { cookies } from 'next/headers';
import { Page } from '@/schemas/site';
import { initializeFirebase } from '@/lib/firebase';

export async function createPage(type: Page['type'] = 'editor') {
  const cookieStore = cookies();
  const siteId = cookieStore.get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };

  try {
    const { firestore } = initializeFirebase();
    const docRef = await addDoc(collection(firestore, 'pages'), {
      siteId: siteId,
      name: 'New Page',
      elements: [],
      type: type,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error: any) {
    await logErrorToFirestore({
        message: `Failed to create page: ${error.message}`,
        stack: error.stack,
        source: 'createPage',
    });
    return { success: false, error: 'Failed to create page. An error has been logged.' };
  }
}

export async function savePage(id: string, data: Partial<Omit<Page, 'id' | 'siteId'>>) {
  const cookieStore = cookies();
  const siteId = cookieStore.get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };
  
  try {
    const { firestore } = initializeFirebase();
    const pageRef = doc(firestore, 'pages', id);
    const pageSnap = await getDoc(pageRef);
    if (!pageSnap.exists() || pageSnap.data().siteId !== siteId) {
        return { success: false, error: 'Unauthorized.' };
    }
    
    let dataToSave: any = { ...data, updatedAt: serverTimestamp() };

    if (data.elements) {
        dataToSave.reactComponent = await convertJsonToJsx(data.elements);
    }
    
    await setDoc(pageRef, dataToSave, { merge: true });
    return { success: true, id };
  } catch (error: any) {
    await logErrorToFirestore({
        message: `Failed to save page ${id}: ${error.message}`,
        stack: error.stack,
        source: 'savePage',
    });
    return { success: false, error: `Failed to save page ${id}. An error has been logged.` };
  }
}

export async function getPage(id: string): Promise<{ success: boolean, page?: Page, error?: string }> {
    const cookieStore = cookies();
    const siteId = cookieStore.get('siteId')?.value;
    if (!siteId) return { success: false, error: 'Site ID not found.' };

    try {
        const { firestore } = initializeFirebase();
        const q = query(
            collection(firestore, 'pages'),
            where('__name__', '==', id),
            where('siteId', '==', siteId),
            limit(1)
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return { success: false, error: 'Page not found or you do not have permission to access it.' };
        }
        
        const docSnap = querySnapshot.docs[0];
        const data = docSnap.data();
        
        const createdAt = data.createdAt;
        const updatedAt = data.updatedAt;

        const page: Page = {
          id: docSnap.id,
          siteId: data.siteId,
          name: data.name || '',
          elements: data.elements || [],
          reactComponent: data.reactComponent,
          type: data.type || 'editor',
          createdAt: createdAt instanceof Timestamp ? createdAt.toDate().toISOString() : null,
          updatedAt: updatedAt instanceof Timestamp ? updatedAt.toDate().toISOString() : null,
        }

        return { success: true, page };

    } catch (error: any) {
        await logErrorToFirestore({
            message: `Failed to fetch page with ID ${id}: ${error.message}`,
            stack: error.stack,
            source: 'getPage',
        });
        return { success: false, error: 'Failed to fetch page. An error has been logged.' };
    }
}

/**
 * Fetches all pages from Firestore for the current siteId.
 */
export async function getPages(): Promise<{ success: boolean, pages?: Page[], error?: string }> {
  const cookieStore = cookies();
  const siteId = cookieStore.get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };

  try {
    const { firestore } = initializeFirebase();
    const q = query(collection(firestore, 'pages'), where('siteId', '==', siteId));
    const querySnapshot = await getDocs(q);
    const pages = querySnapshot.docs.map(doc => {
      const data = doc.data();
      const createdAt = data.createdAt;
      const updatedAt = data.updatedAt;
      
      return {
        id: doc.id,
        siteId: data.siteId,
        name: data.name || '',
        elements: data.elements,
        reactComponent: data.reactComponent,
        type: data.type || 'editor',
        createdAt: createdAt instanceof Timestamp ? createdAt.toDate().toISOString() : null,
        updatedAt: updatedAt instanceof Timestamp ? updatedAt.toDate().toISOString() : null,
      } as Page;
    });
    return { success: true, pages };
  } catch (error: any) {
    await logErrorToFirestore({
        message: `Failed to fetch pages: ${error.message}`,
        stack: error.stack,
        source: 'getPages',
    });
    return { success: false, error: 'Failed to fetch pages. An error has been logged.' };
  }
}


/**
 * Deletes a page and its associated paths from Firestore.
 * @param id The ID of the page to delete.
 */
export async function deletePage(id: string) {
  const cookieStore = cookies();
  const siteId = cookieStore.get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };

  try {
    const { firestore } = initializeFirebase();
    const batch = writeBatch(firestore);

    const pageRef = doc(firestore, 'pages', id);
    const pageSnap = await getDoc(pageRef);
    if (!pageSnap.exists() || pageSnap.data().siteId !== siteId) {
        return { success: false, error: 'Unauthorized.' };
    }
    batch.delete(pageRef);

    const pathsQuery = query(collection(firestore, 'paths'), where('pageId', '==', id), where('siteId', '==', siteId));
    const pathsSnapshot = await getDocs(pathsQuery);
    pathsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    return { success: true };
  } catch (error: any) {
    await logErrorToFirestore({
        message: `Failed to delete page with ID ${id}: ${error.message}`,
        stack: error.stack,
        source: 'deletePage',
    });
    return { success: false, error: `Failed to delete page with ID ${id}. An error has been logged.` };
  }
}
