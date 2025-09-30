
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, deleteDoc, query, where, writeBatch, getDoc, limit } from 'firebase/firestore';
import { logErrorToFirestore } from './logging';

export interface Path {
    id: string;
    path: string;
    pageId: string;
}

/**
 * Creates or updates a path mapping in Firestore.
 * Ensures that each path is unique.
 */
export async function createPath(path: string, pageId: string): Promise<{ success: boolean, id?: string, error?: string }> {
  try {
    const pathsRef = collection(db, 'paths');
    const batch = writeBatch(db);

    // Check if the path is already assigned to any page
    const pathQuery = query(pathsRef, where('path', '==', path));
    const pathSnapshot = await getDocs(pathQuery);
    if (!pathSnapshot.empty) {
        // If it's assigned to a different page, throw an error
        if (pathSnapshot.docs[0].data().pageId !== pageId) {
            return { success: false, error: `Path "${path}" is already in use by another page.` };
        }
        // If it's assigned to the same page, we can just return success
        return { success: true, id: pathSnapshot.docs[0].id };
    }

    // Check if the page already has a path and delete the old one
    const pageQuery = query(pathsRef, where('pageId', '==', pageId));
    const pageSnapshot = await getDocs(pageQuery);
    pageSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Create the new path mapping
    const newPathRef = doc(collection(db, 'paths'));
    batch.set(newPathRef, { path, pageId });
    
    await batch.commit();

    return { success: true, id: newPathRef.id };
  } catch (error: any) {
    console.error(`Failed to create path "${path}":`, error);
    await logErrorToFirestore({
      message: `Failed to create path "${path}": ` + error.message,
      stack: error.stack,
    });
    return { success: false, error: error.message || 'Failed to create path.' };
  }
}

/**
 * Fetches all path mappings from Firestore.
 */
export async function getPaths(): Promise<{ success: boolean, paths?: Path[], error?: string }> {
  try {
    const querySnapshot = await getDocs(collection(db, 'paths'));
    const paths = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Path));
    return { success: true, paths };
  } catch (error: any) {
    console.error('Failed to fetch paths:', error);
    await logErrorToFirestore({
      message: 'Failed to fetch paths: ' + error.message,
      stack: error.stack,
    });
    return { success: false, error: error.message || 'Failed to fetch paths.' };
  }
}

/**
 * Deletes a path mapping from Firestore by its ID.
 */
export async function deletePath(id: string): Promise<{ success: boolean, error?: string }> {
  try {
    await deleteDoc(doc(db, 'paths', id));
    return { success: true };
  } catch (error: any) {
    console.error(`Failed to delete path with ID ${id}:`, error);
     await logErrorToFirestore({
      message: `Failed to delete path with ID ${id}: ` + error.message,
      stack: error.stack,
    });
    return { success: false, error: error.message || 'Failed to delete path.' };
  }
}


/**
 * Fetches the path mapping for a specific page.
 * @param pageId The ID of the page.
 */
export async function getPathForPage(pageId: string): Promise<{ success: boolean; path?: Path; error?: string }> {
  try {
    const pathsRef = collection(db, 'paths');
    const q = query(pathsRef, where('pageId', '==', pageId), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: true, path: undefined }; // No path assigned is not an error
    }

    const doc = querySnapshot.docs[0];
    const pathData = { id: doc.id, ...doc.data() } as Path;

    return { success: true, path: pathData };
  } catch (error: any) {
    console.error(`Failed to fetch path for page ${pageId}:`, error);
    await logErrorToFirestore({
      message: `Failed to fetch path for page ${pageId}: ` + error.message,
      stack: error.stack,
    });
    return { success: false, error: `Failed to fetch path for page.` };
  }
}
