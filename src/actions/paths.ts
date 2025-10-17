'use server';

import { getFirestore, collection, addDoc, doc, deleteDoc, getDocs, query, where, serverTimestamp, Timestamp, getDoc } from 'firebase/firestore';
import { cookies } from 'next/headers';
import { initializeFirebase } from '@/lib/firebase';
import { logErrorToFirestore } from '@/lib/logging';
import { markStructureAsPending } from './structure';

export interface Path {
  id: string;
  siteId: string;
  pageId: string;
  path: string;
  createdAt: string | null;
}

/**
 * Creates a new path mapping for a page.
 */
export async function addPath(pageId: string, path: string): Promise<{ success: boolean; id?: string; error?: string }> {
  const cookieStore = await cookies();
  const siteId = cookieStore.get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };

  if (!path.startsWith('/')) {
      return { success: false, error: 'Path must start with a "/"' };
  }

  try {
    const { firestore } = initializeFirebase();
    
    // Check if path already exists for this site
    const q = query(collection(firestore, 'paths'), where('siteId', '==', siteId), where('path', '==', path));
    const existingPaths = await getDocs(q);
    if (!existingPaths.empty) {
        return { success: false, error: `Path "${path}" is already in use on this site.` };
    }

    const docRef = await addDoc(collection(firestore, 'paths'), {
      siteId,
      pageId,
      path,
      createdAt: serverTimestamp(),
    });

    await markStructureAsPending(siteId, [path]);

    return { success: true, id: docRef.id };
  } catch (error: any) {
    await logErrorToFirestore({
        message: `Failed to add path: ${error.message}`,
        stack: error.stack,
        source: 'addPath',
    });
    return { success: false, error: 'Failed to add path. An error has been logged.' };
  }
}

/**
 * Fetches all paths for a specific page.
 */
export async function getPathsForPage(pageId: string): Promise<{ success: boolean; paths?: Path[]; error?: string }> {
  const cookieStore = await cookies();
  const siteId = cookieStore.get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };

  try {
    const { firestore } = initializeFirebase();
    const q = query(collection(firestore, 'paths'), where('siteId', '==', siteId), where('pageId', '==', pageId));
    const querySnapshot = await getDocs(q);
    const paths = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      const createdAt = data.createdAt;
      return {
        id: docSnap.id,
        siteId: data.siteId,
        pageId: data.pageId,
        path: data.path,
        createdAt: createdAt instanceof Timestamp ? createdAt.toDate().toISOString() : null,
      } as Path;
    });
    return { success: true, paths };
  } catch (error: any) {
    await logErrorToFirestore({
        message: `Failed to fetch paths for page ${pageId}: ${error.message}`,
        stack: error.stack,
        source: 'getPathsForPage',
    });
    return { success: false, error: 'Failed to fetch paths. An error has been logged.' };
  }
}

/**
 * Deletes a path mapping.
 */
export async function deletePath(id: string): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies();
  const siteId = cookieStore.get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };

  try {
    const { firestore } = initializeFirebase();
    const pathRef = doc(firestore, 'paths', id);
    const pathSnap = await getDoc(pathRef);
    if (!pathSnap.exists() || pathSnap.data().siteId !== siteId) {
        return { success: false, error: 'Path not found or unauthorized.' };
    }
    const pathData = pathSnap.data();
    await deleteDoc(pathRef);

    await markStructureAsPending(siteId, [pathData.path], true);

    return { success: true };
  } catch (error: any) {
    await logErrorToFirestore({
        message: `Failed to delete path ${id}: ${error.message}`,
        stack: error.stack,
        source: 'deletePath',
    });
    return { success: false, error: 'Failed to delete path. An error has been logged.' };
  }
}