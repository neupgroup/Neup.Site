
'use server';

import {
  collection,
  doc,
  deleteDoc,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
  Timestamp,
  orderBy,
} from 'firebase/firestore';
import { initializeFirebase } from '@/lib/firebase';
import { logErrorToFirestore } from '@/lib/logging';
import { getAccountId } from './accounts';
import { revalidatePath } from 'next/cache';
import type { EnvironmentVariable } from '@/schemas/environment';
import { cookies } from 'next/headers';


export async function createEnvironmentVariable(data: Omit<EnvironmentVariable, 'id' | 'siteId' | 'createdBy' | 'createdOn'>): Promise<{ success: boolean; id?: string; error?: string }> {
  const accountId = await getAccountId();
  const siteId = cookies().get('siteId')?.value;

  if (!accountId || !siteId) {
    return { success: false, error: 'User or site context not found.' };
  }

  try {
    const { firestore } = initializeFirebase();
    const docRef = await addDoc(collection(firestore, 'environments'), {
      ...data,
      siteId,
      createdBy: accountId,
      createdOn: serverTimestamp(),
    });

    revalidatePath('/site/environment');
    return { success: true, id: docRef.id };
  } catch (e: any) {
    await logErrorToFirestore({ message: `Failed to create environment variable: ${e.message}`, stack: e.stack, source: 'createEnvironmentVariable' });
    return { success: false, error: 'Failed to create environment variable.' };
  }
}

export async function getEnvironmentVariables(): Promise<{ success: boolean; variables?: EnvironmentVariable[]; error?: string }> {
  const siteId = cookies().get('siteId')?.value;
  if (!siteId) {
    return { success: false, error: 'Site context not found.' };
  }

  try {
    const { firestore } = initializeFirebase();
    const envRef = collection(firestore, 'environments');
    const q = query(envRef, where('siteId', '==', siteId), orderBy('createdOn', 'desc'));
    
    const querySnapshot = await getDocs(q);
    const variables = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      const createdOn = data.createdOn;
      return {
        id: docSnap.id,
        siteId: data.siteId,
        name: data.name,
        value: data.value,
        dataType: data.dataType,
        isPrivate: data.isPrivate,
        createdBy: data.createdBy,
        createdOn: createdOn instanceof Timestamp ? createdOn.toDate().toISOString() : null,
      } as EnvironmentVariable;
    });
    return { success: true, variables };
  } catch (e: any) {
    await logErrorToFirestore({ message: `Failed to get environment variables: ${e.message}`, stack: e.stack, source: 'getEnvironmentVariables' });
    return { success: false, error: 'Failed to fetch environment variables.' };
  }
}

export async function deleteEnvironmentVariable(id: string): Promise<{ success: boolean; error?: string }> {
  const siteId = cookies().get('siteId')?.value;
  if (!siteId) {
    return { success: false, error: 'Site context not found.' };
  }

  try {
    const { firestore } = initializeFirebase();
    await deleteDoc(doc(firestore, 'environments', id));
    revalidatePath('/site/environment');
    return { success: true };
  } catch (e: any) {
    await logErrorToFirestore({ message: `Failed to delete environment variable ${id}: ${e.message}`, stack: e.stack, source: 'deleteEnvironmentVariable' });
    return { success: false, error: 'Failed to delete environment variable.' };
  }
}
