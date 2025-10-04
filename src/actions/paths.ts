
'use server';

import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, query, where, writeBatch, getDoc, limit } from 'firebase/firestore';
import { cookies } from 'next/headers';
import { initializeFirebase } from '@/lib/firebase';

export interface Path {
    id: string;
    siteId: string;
    path: string;
    pageId: string;
}

/**
 * Creates or updates a path mapping in Firestore.
 * Ensures that each path is unique within a siteId.
 */
export async function createPath(path: string, pageId: string): Promise<{ success: boolean, id?: string, error?: string }> {
  const cookieStore = cookies();
  const siteId = cookieStore.get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };
  
  try {
    const { firestore } = initializeFirebase();
    const pathsRef = collection(firestore, 'paths');
    const batch = writeBatch(firestore);

    const pathQuery = query(pathsRef, where('path', '==', path), where('siteId', '==', siteId));
    const pathSnapshot = await getDocs(pathQuery);
    if (!pathSnapshot.empty) {
        if (pathSnapshot.docs[0].data().pageId !== pageId) {
            return { success: false, error: `Path "${path}" is already in use by another page.` };
        }
        return { success: true, id: pathSnapshot.docs[0].id };
    }

    const pageQuery = query(pathsRef, where('pageId', '==', pageId), where('siteId', '==', siteId));
    const pageSnapshot = await getDocs(pageQuery);
    pageSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    const newPathRef = doc(collection(firestore, 'paths'));
    batch.set(newPathRef, { path, pageId, siteId });
    
    await batch.commit();

    return { success: true, id: newPathRef.id };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create path.' };
  }
}

/**
 * Fetches all path mappings from Firestore for the current siteId.
 */
export async function getPaths(): Promise<{ success: boolean, paths?: Path[], error?: string }> {
  const cookieStore = cookies();
  const siteId = cookieStore.get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };

  try {
    const { firestore } = initializeFirebase();
    const q = query(collection(firestore, 'paths'), where('siteId', '==', siteId));
    const querySnapshot = await getDocs(q);
    const paths = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Path));
    return { success: true, paths };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch paths.' };
  }
}

/**
 * Deletes a path mapping from Firestore by its ID.
 */
export async function deletePath(id: string): Promise<{ success: boolean, error?: string }> {
  const cookieStore = cookies();
  const siteId = cookieStore.get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };

  try {
    const { firestore } = initializeFirebase();
    const pathRef = doc(firestore, 'paths', id);
    const pathSnap = await getDoc(pathRef);
    if (!pathSnap.exists() || pathSnap.data().siteId !== siteId) {
        return { success: false, error: 'Unauthorized' };
    }
    await deleteDoc(pathRef);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete path.' };
  }
}


/**
 * Fetches the path mapping for a specific page.
 */
export async function getPathForPage(pageId: string): Promise<{ success: boolean; path?: Path; error?: string }> {
  const cookieStore = cookies();
  const siteId = cookieStore.get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };

  try {
    const { firestore } = initializeFirebase();
    const pathsRef = collection(firestore, 'paths');
    const q = query(pathsRef, where('pageId', '==', pageId), where('siteId', '==', siteId), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: true, path: undefined };
    }

    const doc = querySnapshot.docs[0];
    const pathData = { id: doc.id, ...doc.data() } as Path;

    return { success: true, path: pathData };
  } catch (error: any) {
    return { success: false, error: `Failed to fetch path for page.` };
  }
}
