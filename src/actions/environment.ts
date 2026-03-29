

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
  limit,
  getCountFromServer,
  startAfter,
} from '@/lib/firestore';
import { getDataStore } from '@/lib/data-store';
import { logErrorToDatabase } from '@/lib/logging';
import { getAccountId } from './accounts';
import { revalidatePath } from 'next/cache';
import type { EnvironmentVariable } from '@/schemas/environment';
import { cookies } from 'next/headers';
import { markEnvironmentsAsPending } from './structure';


export async function createEnvironmentVariable(data: Omit<EnvironmentVariable, 'id' | 'siteId' | 'createdBy' | 'createdOn'>): Promise<{ success: boolean; id?: string; error?: string }> {
  const accountId = await getAccountId();
  const siteId = cookies().get('siteId')?.value;

  if (!accountId || !siteId) {
    return { success: false, error: 'User or site context not found.' };
  }

  try {
    const { firestore } = getDataStore();
    const docRef = await addDoc(collection(firestore, 'environments'), {
      ...data,
      siteId,
      createdBy: accountId,
      createdOn: serverTimestamp(),
    });

    await markEnvironmentsAsPending(siteId);

    revalidatePath('/site/environment');
    return { success: true, id: docRef.id };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to create environment variable: ${e.message}`, stack: e.stack, source: 'createEnvironmentVariable' });
    return { success: false, error: 'Failed to create environment variable.' };
  }
}

export async function getEnvironmentVariables({ page = 1, pageSize = 10 }: { page?: number; pageSize?: number } = {}): Promise<{ success: boolean; variables?: EnvironmentVariable[]; error?: string; totalCount?: number }> {
  const siteId = cookies().get('siteId')?.value;
  if (!siteId) {
    return { success: false, error: 'Site context not found.' };
  }

  try {
    const { firestore } = getDataStore();
    const envRef = collection(firestore, 'environments');
    const siteQuery = query(envRef, where('siteId', '==', siteId));
    
    const countSnapshot = await getCountFromServer(siteQuery);
    const totalCount = countSnapshot.data().count;

    const baseQuery = query(siteQuery, orderBy('createdOn', 'desc'));

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
    return { success: true, variables, totalCount };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to get environment variables: ${e.message}`, stack: e.stack, source: 'getEnvironmentVariables' });
    return { success: false, error: 'Failed to fetch environment variables.' };
  }
}

export async function deleteEnvironmentVariable(id: string): Promise<{ success: boolean; error?: string }> {
  const siteId = cookies().get('siteId')?.value;
  if (!siteId) {
    return { success: false, error: 'Site context not found.' };
  }

  try {
    const { firestore } = getDataStore();
    await deleteDoc(doc(firestore, 'environments', id));
    await markEnvironmentsAsPending(siteId);
    revalidatePath('/site/environment');
    return { success: true };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to delete environment variable ${id}: ${e.message}`, stack: e.stack, source: 'deleteEnvironmentVariable' });
    return { success: false, error: 'Failed to delete environment variable.' };
  }
}
