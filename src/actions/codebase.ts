
'use server';

import { getFirestore, collection, addDoc, doc, deleteDoc, getDocs, getDoc, query, where, serverTimestamp, Timestamp, orderBy } from 'firebase/firestore';
import { cookies } from 'next/headers';
import { initializeFirebase } from '@/lib/firebase';
import { logErrorToFirestore } from '@/lib/logging';
import type { CodeFile } from '@/schemas/codebase';

/**
 * Creates a new code file entry in Firestore.
 */
export async function uploadCodeFile(fileData: Omit<CodeFile, 'id' | 'createdAt' | 'siteId'>) {
  const cookieStore = cookies();
  const siteId = cookieStore.get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };

  try {
    const { firestore } = initializeFirebase();
    const docRef = await addDoc(collection(firestore, 'codeFiles'), {
      ...fileData,
      siteId,
      createdAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error: any) {
    await logErrorToFirestore({ message: `Failed to upload code file: ${error.message}`, source: 'uploadCodeFile' });
    return { success: false, error: error.message || 'Failed to upload file.' };
  }
}

/**
 * Fetches all code files for the current site.
 */
export async function getCodeFiles(): Promise<{ success: boolean; files?: CodeFile[]; error?: string }> {
  const cookieStore = cookies();
  const siteId = cookieStore.get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };

  try {
    const { firestore } = initializeFirebase();
    const q = query(collection(firestore, 'codeFiles'), where('siteId', '==', siteId), orderBy('filePath', 'asc'));
    const querySnapshot = await getDocs(q);
    const files = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : null,
        } as CodeFile;
    });
    return { success: true, files };
  } catch (error: any) {
    await logErrorToFirestore({ message: `Failed to get code files: ${error.message}`, source: 'getCodeFiles' });
    return { success: false, error: error.message || 'Failed to fetch files.' };
  }
}

/**
 * Deletes a code file from Firestore.
 */
export async function deleteCodeFile(id: string) {
  const cookieStore = cookies();
  const siteId = cookieStore.get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };
  
  try {
    const { firestore } = initializeFirebase();
    const fileRef = doc(firestore, 'codeFiles', id);
    const fileSnap = await getDoc(fileRef);

    if (!fileSnap.exists() || fileSnap.data().siteId !== siteId) {
        return { success: false, error: 'File not found or unauthorized.' };
    }

    await deleteDoc(fileRef);
    return { success: true };
  } catch (error: any) {
    await logErrorToFirestore({ message: `Failed to delete code file ${id}: ${error.message}`, source: 'deleteCodeFile' });
    return { success: false, error: error.message || 'Failed to delete file.' };
  }
}
