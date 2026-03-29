
'use server';

import { getFirestore, collection, addDoc, doc, deleteDoc, getDocs, getDoc, query, where, serverTimestamp, Timestamp, orderBy, limit, getCountFromServer, startAfter } from '@/lib/firestore';
import { cookies } from 'next/headers';
import { getDataStore } from '@/lib/data-store';
import { logErrorToDatabase } from '@/lib/logging';
import type { CodeFile } from '@/schemas/codebase';

/**
 * Creates a new code file entry in Firestore.
 */
export async function uploadCodeFile(fileData: Omit<CodeFile, 'id' | 'createdAt' | 'siteId'>) {
  const cookieStore = await cookies();
  const siteId = cookieStore.get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };

  try {
    const { firestore } = getDataStore();
    const docRef = await addDoc(collection(firestore, 'codeFiles'), {
      ...fileData,
      siteId,
      createdAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error: any) {
    await logErrorToDatabase({ message: `Failed to upload code file: ${error.message}`, source: 'uploadCodeFile' });
    return { success: false, error: error.message || 'Failed to upload file.' };
  }
}

/**
 * Fetches code files for the current site with pagination.
 */
export async function getCodeFiles({ page = 1, pageSize = 10 }: { page?: number, pageSize?: number }): Promise<{ success: boolean; files?: CodeFile[]; error?: string; totalCount?: number }> {
  const cookieStore = await cookies();
  const siteId = cookieStore.get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };

  try {
    const { firestore } = getDataStore();
    const filesRef = collection(firestore, 'codeFiles');
    const siteQuery = query(filesRef, where('siteId', '==', siteId));

    const countSnapshot = await getCountFromServer(siteQuery);
    const totalCount = countSnapshot.data().count;

    const baseQuery = query(siteQuery, orderBy('createdAt', 'desc'));

    let finalQuery;
    if (page > 1) {
      const prevPageQuery = query(baseQuery, limit((page - 1) * pageSize));
      const prevPageSnapshot = await getDocs(prevPageQuery);
      const lastVisible = prevPageSnapshot.docs[prevPageSnapshot.docs.length - 1];
      finalQuery = query(baseQuery, startAfter(lastVisible), limit(pageSize));
    } else {
      finalQuery = query(baseQuery, limit(pageSize));
    }

    const querySnapshot = await getDocs(finalQuery);
    const files = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : null,
      } as CodeFile;
    });

    return { success: true, files, totalCount };
  } catch (error: any) {
    await logErrorToDatabase({ message: `Failed to get code files: ${error.message}`, source: 'getCodeFiles' });
    return { success: false, error: error.message || 'Failed to fetch files.' };
  }
}


/**
 * Deletes a code file from Firestore.
 */
export async function deleteCodeFile(id: string) {
  const cookieStore = await cookies();
  const siteId = cookieStore.get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };

  try {
    const { firestore } = getDataStore();
    const fileRef = doc(firestore, 'codeFiles', id);
    const fileSnap = await getDoc(fileRef);

    if (!fileSnap.exists() || fileSnap.data().siteId !== siteId) {
      return { success: false, error: 'File not found or unauthorized.' };
    }

    await deleteDoc(fileRef);
    return { success: true };
  } catch (error: any) {
    await logErrorToDatabase({ message: `Failed to delete code file ${id}: ${error.message}`, source: 'deleteCodeFile' });
    return { success: false, error: error.message || 'Failed to delete file.' };
  }
}
