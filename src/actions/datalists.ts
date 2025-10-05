
'use server';

import { getFirestore, collection, addDoc, doc, setDoc, getDocs, getDoc, deleteDoc, serverTimestamp, Timestamp, query, where } from 'firebase/firestore';
import { cookies } from 'next/headers';
import { initializeFirebase } from '@/lib/firebase';
import type { Datalist } from '@/schemas/datalist';

/**
 * Creates a new datalist.
 */
export async function createDatalist(datalistData: Omit<Datalist, 'id' | 'createdAt' | 'updatedAt' | 'siteId'>): Promise<{ success: boolean; id?: string; error?: string }> {
  const cookieStore = cookies();
  const siteId = cookieStore.get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };

  try {
    const { firestore } = initializeFirebase();
    const docRef = await addDoc(collection(firestore, 'datalists'), {
      ...datalistData,
      siteId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error: any) {
    return { success: false, error: 'Failed to create datalist.' };
  }
}

/**
 * Fetches all datalists for the current site.
 */
export async function getDatalists(): Promise<{ success: boolean; datalists?: Datalist[]; error?: string }> {
  const cookieStore = cookies();
  const siteId = cookieStore.get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };

  try {
    const { firestore } = initializeFirebase();
    const q = query(collection(firestore, 'datalists'), where('siteId', '==', siteId));
    const querySnapshot = await getDocs(q);
    const datalists = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data
      } as Datalist;
    });
    return { success: true, datalists };
  } catch (error: any) {
    return { success: false, error: 'Failed to fetch datalists.' };
  }
}

/**
 * Fetches a single datalist by its ID.
 */
export async function getDatalist(id: string): Promise<{ success: boolean; datalist?: Datalist; error?: string }> {
  const cookieStore = cookies();
  const siteId = cookieStore.get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };

  try {
    const { firestore } = initializeFirebase();
    const docRef = doc(firestore, 'datalists', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists() || docSnap.data().siteId !== siteId) {
      return { success: false, error: 'Datalist not found or unauthorized.' };
    }

    const data = docSnap.data();
    const datalist: Datalist = {
      id: docSnap.id,
      siteId: data.siteId,
      name: data.name,
      data: data.data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : null,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : null,
    };
    return { success: true, datalist };
  } catch (error: any) {
    return { success: false, error: 'Failed to fetch datalist.' };
  }
}

/**
 * Updates a datalist.
 */
export async function updateDatalist(id: string, datalistData: Partial<Omit<Datalist, 'id' | 'siteId' | 'createdAt'>>): Promise<{ success: boolean; error?: string }> {
  const cookieStore = cookies();
  const siteId = cookieStore.get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };

  try {
    const { firestore } = initializeFirebase();
    const docRef = doc(firestore, 'datalists', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists() || docSnap.data().siteId !== siteId) {
      return { success: false, error: 'Datalist not found or unauthorized.' };
    }

    await setDoc(docRef, {
      ...datalistData,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'Failed to update datalist.' };
  }
}

/**
 * Deletes a datalist.
 */
export async function deleteDatalist(id: string): Promise<{ success: boolean; error?: string }> {
  const cookieStore = cookies();
  const siteId = cookieStore.get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };

  try {
    const { firestore } = initializeFirebase();
    const docRef = doc(firestore, 'datalists', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists() || docSnap.data().siteId !== siteId) {
      return { success: false, error: 'Datalist not found or unauthorized.' };
    }

    await deleteDoc(docRef);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'Failed to delete datalist.' };
  }
}
