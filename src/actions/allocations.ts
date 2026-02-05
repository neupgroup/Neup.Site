
'use server';

import {
  collection,
  doc,
  setDoc,
  getDoc,
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
import type { Allocation } from '@/schemas/allocation';
import { logErrorToFirestore } from '@/lib/logging';

export async function createAllocation(data: Omit<Allocation, 'id' | 'allocatedOn' | 'status'>): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { firestore } = initializeFirebase();
    const docRef = await addDoc(collection(firestore, 'allocations'), {
      ...data,
      allocatedOn: serverTimestamp(),
      status: 'active', // Default status
    });
    revalidatePath('/root/servers/allocations');
    return { success: true, id: docRef.id };
  } catch (e: any) {
    await logErrorToFirestore({ message: `Failed to create allocation: ${e.message}`, stack: e.stack, source: 'createAllocation' });
    return { success: false, error: 'Failed to create allocation.' };
  }
}

export async function getAllocations(): Promise<{ success: boolean; allocations?: Allocation[]; error?: string }> {
  try {
    const { firestore } = initializeFirebase();
    const q = query(collection(firestore, 'allocations'));
    const querySnapshot = await getDocs(q);
    const allocations = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      const allocatedOn = data.allocatedOn;
      return {
        id: docSnap.id,
        serverId: data.serverId,
        siteId: data.siteId,
        port: data.port,
        allocatedStorage: data.allocatedStorage,
        allocatedOn: allocatedOn instanceof Timestamp ? allocatedOn.toDate().toISOString() : null,
        status: data.status || 'active',
      } as Allocation;
    });
    return { success: true, allocations };
  } catch (e: any) {
    await logErrorToFirestore({ message: `Failed to get allocations: ${e.message}`, stack: e.stack, source: 'getAllocations' });
    return { success: false, error: 'Failed to fetch allocations.' };
  }
}

export async function getAllocation(id: string): Promise<{ success: boolean; allocation?: Allocation; error?: string }> {
  try {
    const { firestore } = initializeFirebase();
    const docRef = doc(firestore, 'allocations', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: false, error: 'Allocation not found.' };
    }

    const data = docSnap.data();
    const allocatedOn = data.allocatedOn;
    const allocation: Allocation = {
      id: docSnap.id,
      serverId: data.serverId,
      siteId: data.siteId,
      port: data.port,
      allocatedStorage: data.allocatedStorage,
      allocatedOn: allocatedOn instanceof Timestamp ? allocatedOn.toDate().toISOString() : null,
      status: data.status || 'active',
    };
    return { success: true, allocation };

  } catch (e: any) {
    await logErrorToFirestore({ message: `Failed to get allocation ${id}: ${e.message}`, stack: e.stack, source: 'getAllocation' });
    return { success: false, error: 'Failed to fetch allocation.' };
  }
}

export async function updateAllocation(id: string, data: Partial<Omit<Allocation, 'id' | 'allocatedOn'>>): Promise<{ success: boolean; error?: string }> {
  try {
    const { firestore } = initializeFirebase();
    const docRef = doc(firestore, 'allocations', id);
    await setDoc(docRef, data, { merge: true });
    revalidatePath('/root/servers/allocations');
    revalidatePath(`/root/servers/allocations/${id}`);
    return { success: true };
  } catch (e: any) {
    await logErrorToFirestore({ message: `Failed to update allocation ${id}: ${e.message}`, stack: e.stack, source: 'updateAllocation' });
    return { success: false, error: 'Failed to update allocation.' };
  }
}

export async function deleteAllocation(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { firestore } = initializeFirebase();
    await deleteDoc(doc(firestore, 'allocations', id));
    revalidatePath('/root/servers/allocations');
    return { success: true };
  } catch (e: any) {
    await logErrorToFirestore({ message: `Failed to delete allocation ${id}: ${e.message}`, stack: e.stack, source: 'deleteAllocation' });
    return { success: false, error: 'Failed to delete allocation.' };
  }
}

export async function updateAllocationPort(siteId: string, serverId: string, port: number): Promise<{ success: boolean; error?: string }> {
  try {
    const { firestore } = initializeFirebase();
    const q = query(collection(firestore, 'allocations'), where('siteId', '==', siteId), where('serverId', '==', serverId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: false, error: 'Allocation not found for this site and server.' };
    }

    const docRef = querySnapshot.docs[0].ref;
    await setDoc(docRef, { port }, { merge: true });

    revalidatePath('/root/servers/allocations');
    revalidatePath('/settings/info');

    return { success: true };
  } catch (e: any) {
    await logErrorToFirestore({ message: `Failed to update allocation port for site ${siteId}: ${e.message}`, stack: e.stack, source: 'updateAllocationPort' });
    return { success: false, error: 'Failed to update allocation port.' };
  }
}
