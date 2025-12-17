
'use server';

import {
  collection,
  doc,
  setDoc,
  getDocs,
  Timestamp,
  deleteDoc,
  serverTimestamp,
  addDoc,
  query,
  where,
} from 'firebase/firestore';
import { initializeFirebase } from '@/lib/firebase';
import { revalidatePath } from 'next/cache';
import type { Redirect } from '@/schemas/redirect';
import { logErrorToFirestore } from '@/lib/logging';
import { getAccountId } from '@/actions/accounts';
import { cookies } from 'next/headers';
import { markRedirectsAsPending } from './structure';

export async function createRedirect(data: Omit<Redirect, 'id' | 'siteId' | 'created_by' | 'created_on'>): Promise<{ success: boolean; id?: string; error?: string }> {
  const accountId = await getAccountId();
  const siteId = cookies().get('siteId')?.value;

  if (!accountId || !siteId) {
    return { success: false, error: 'User or site context not found.' };
  }

  try {
    const { firestore } = initializeFirebase();
    const docRef = await addDoc(collection(firestore, 'redirects'), {
      ...data,
      siteId,
      created_by: accountId,
      created_on: serverTimestamp(),
    });
    
    await markRedirectsAsPending(siteId);

    revalidatePath('/manage/redirects');
    return { success: true, id: docRef.id };
  } catch (e: any) {
    await logErrorToFirestore({ message: `Failed to create redirect: ${e.message}`, stack: e.stack, source: 'createRedirect' });
    return { success: false, error: 'Failed to create redirect.' };
  }
}

export async function getRedirects(): Promise<{ success: boolean; redirects?: Redirect[]; error?: string }> {
    const siteId = cookies().get('siteId')?.value;
    if (!siteId) {
        return { success: false, error: 'Site context not found.' };
    }

  try {
    const { firestore } = initializeFirebase();
    const q = query(collection(firestore, 'redirects'), where('siteId', '==', siteId));
    const querySnapshot = await getDocs(q);
    const redirects = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      const createdOn = data.created_on;
      return {
        id: docSnap.id,
        siteId: data.siteId,
        from: data.from,
        to: data.to,
        type: data.type,
        created_by: data.created_by,
        created_on: createdOn instanceof Timestamp ? createdOn.toDate().toISOString() : null,
      } as Redirect;
    });
    return { success: true, redirects };
  } catch (e: any) {
    await logErrorToFirestore({ message: `Failed to get redirects: ${e.message}`, stack: e.stack, source: 'getRedirects' });
    return { success: false, error: 'Failed to fetch redirects.' };
  }
}

export async function deleteRedirect(id: string): Promise<{ success: boolean; error?: string }> {
  const siteId = cookies().get('siteId')?.value;
  if (!siteId) {
    return { success: false, error: 'Site context not found.' };
  }

  try {
    const { firestore } = initializeFirebase();
    await deleteDoc(doc(firestore, 'redirects', id));
    
    await markRedirectsAsPending(siteId);

    revalidatePath('/manage/redirects');
    return { success: true };
  } catch (e: any) {
    await logErrorToFirestore({ message: `Failed to delete redirect ${id}: ${e.message}`, stack: e.stack, source: 'deleteRedirect' });
    return { success: false, error: 'Failed to delete redirect.' };
  }
}
