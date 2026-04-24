
'use server';

import { getFirestore, collection, addDoc, doc, deleteDoc, getDocs, query, where, serverTimestamp, Timestamp, getDoc } from '@/lib/firestore';
import { cookies } from 'next/headers';
import { getDataStore } from '@/lib/data-store';
import { logErrorToDatabase } from '@/lib/logging';
import { markStructureAsPending } from './structure';

export interface Path {
  id: string;
  artifactId: string;
  pageId: string;
  path: string;
  createdAt: string | null;
}

/**
 * Creates a new path mapping for a page.
 */
export async function addPath(pageId: string, path: string): Promise<{ success: boolean; id?: string; error?: string }> {
  const cookieStore = await cookies();
  const artifactId = cookieStore.get('artifactId')?.value;
  if (!artifactId) return { success: false, error: 'Artifact ID not found.' };

  if (!path.startsWith('/')) {
    return { success: false, error: 'Path must start with a "/"' };
  }

  try {
    const { firestore } = getDataStore();

    // Check if path already exists for this site
    const q = query(collection(firestore, 'paths'), where('artifactId', '==', artifactId), where('path', '==', path));
    const existingPaths = await getDocs(q);
    if (!existingPaths.empty) {
      return { success: false, error: `Path "${path}" is already in use on this site.` };
    }

    const docRef = await addDoc(collection(firestore, 'paths'), {
      artifactId,
      pageId,
      path,
      createdAt: serverTimestamp(),
    });

    await markStructureAsPending(artifactId, [path]);

    return { success: true, id: docRef.id };
  } catch (error: any) {
    await logErrorToDatabase({
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
  const artifactId = cookieStore.get('artifactId')?.value;
  if (!artifactId) return { success: false, error: 'Artifact ID not found.' };

  try {
    const { firestore } = getDataStore();
    const q = query(collection(firestore, 'paths'), where('artifactId', '==', artifactId), where('pageId', '==', pageId));
    const querySnapshot = await getDocs(q);
    const paths = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      const createdAt = data.createdAt;
      return {
        id: docSnap.id,
        artifactId: data.artifactId,
        pageId: data.pageId,
        path: data.path,
        createdAt: createdAt instanceof Timestamp ? createdAt.toDate().toISOString() : null,
      } as Path;
    });
    return { success: true, paths };
  } catch (error: any) {
    await logErrorToDatabase({
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
  const artifactId = cookieStore.get('artifactId')?.value;
  if (!artifactId) return { success: false, error: 'Artifact ID not found.' };

  try {
    const { firestore } = getDataStore();
    const pathRef = doc(firestore, 'paths', id);
    const pathSnap = await getDoc(pathRef);
    if (!pathSnap.exists() || pathSnap.data().artifactId !== artifactId) {
      return { success: false, error: 'Path not found or unauthorized.' };
    }
    const pathData = pathSnap.data();
    await deleteDoc(pathRef);

    await markStructureAsPending(artifactId, [pathData.path], true);

    return { success: true };
  } catch (error: any) {
    await logErrorToDatabase({
      message: `Failed to delete path ${id}: ${error.message}`,
      stack: error.stack,
      source: 'deletePath',
    });
    return { success: false, error: 'Failed to delete path. An error has been logged.' };
  }
}
