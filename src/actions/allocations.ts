
'use server';

import { getFirestore, collection, addDoc, doc, setDoc, getDocs, getDoc, deleteDoc, serverTimestamp, Timestamp, query, where } from 'firebase/firestore';
import { initializeFirebase } from '@/lib/firebase';
import { ServerAllocation } from '@/schemas/server';

/**
 * Creates a new server allocation.
 */
export async function createServerAllocation(allocationData: Omit<ServerAllocation, 'id' | 'allocatedOn'>): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { firestore } = initializeFirebase();
    const dataToSave = {
        ...allocationData,
        allocatedPorts: allocationData.allocatedPorts || [],
        allocatedOn: serverTimestamp(),
        expiresOn: allocationData.expiresOn ? new Date(allocationData.expiresOn) : null,
    };
    const docRef = await addDoc(collection(firestore, 'serverAllocations'), dataToSave);
    return { success: true, id: docRef.id };
  } catch (error: any) {
    return { success: false, error: 'Failed to create server allocation.' };
  }
}

/**
 * Fetches all server allocations.
 */
export async function getServerAllocations(): Promise<{ success: boolean; allocations?: ServerAllocation[]; error?: string }> {
  try {
    const { firestore } = initializeFirebase();
    const q = query(collection(firestore, 'serverAllocations'));
    const querySnapshot = await getDocs(q);
    const allocations = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      const allocatedOn = data.allocatedOn;
      const expiresOn = data.expiresOn;
      
      return {
        id: docSnap.id,
        siteId: data.siteId,
        serverId: data.serverId,
        username: data.username,
        deploymentPath: data.deploymentPath,
        allocatedPorts: data.allocatedPorts || [],
        allocatedOn: allocatedOn instanceof Timestamp ? allocatedOn.toDate().toISOString() : null,
        expiresOn: expiresOn instanceof Timestamp ? expiresOn.toDate().toISOString() : null,
      } as ServerAllocation;
    });
    return { success: true, allocations };
  } catch (error: any) {
    return { success: false, error: 'Failed to fetch server allocations.' };
  }
}

/**
 * Fetches a single server allocation by its ID.
 */
export async function getServerAllocation(id: string): Promise<{ success: boolean; allocation?: ServerAllocation; error?: string }> {
    try {
        const { firestore } = initializeFirebase();
        const allocationRef = doc(firestore, 'serverAllocations', id);
        const docSnap = await getDoc(allocationRef);

        if (!docSnap.exists()) {
            return { success: false, error: 'Allocation not found.' };
        }
        
        const data = docSnap.data();
        const allocatedOn = data.allocatedOn;
        const expiresOn = data.expiresOn;
        
        const allocation: ServerAllocation = { 
            id: docSnap.id, 
            siteId: data.siteId,
            serverId: data.serverId,
            username: data.username,
            deploymentPath: data.deploymentPath,
            allocatedPorts: data.allocatedPorts || [],
            allocatedOn: allocatedOn instanceof Timestamp ? allocatedOn.toDate().toISOString() : null,
            expiresOn: expiresOn instanceof Timestamp ? expiresOn.toDate().toISOString() : null,
        };
        return { success: true, allocation };
    } catch (error: any) {
        return { success: false, error: 'Failed to fetch server allocation.' };
    }
}


/**
 * Updates a server allocation.
 */
export async function updateServerAllocation(id: string, allocationData: Partial<Omit<ServerAllocation, 'id' | 'allocatedOn'>>): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { firestore } = initializeFirebase();
    const allocationRef = doc(firestore, 'serverAllocations', id);

    const dataToUpdate: Record<string, any> = { ...allocationData };
     if (allocationData.expiresOn) {
        dataToUpdate.expiresOn = new Date(allocationData.expiresOn);
    } else {
        dataToUpdate.expiresOn = null;
    }

    await setDoc(allocationRef, dataToUpdate, { merge: true });
    return { success: true, id };
  } catch (error: any) {
    return { success: false, error: `Failed to update allocation ${id}.` };
  }
}


/**
 * Deletes a server allocation from Firestore by its ID.
 */
export async function deleteServerAllocation(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { firestore } = initializeFirebase();
    const allocationRef = doc(firestore, 'serverAllocations', id);
    await deleteDoc(allocationRef);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: `Failed to delete allocation with ID ${id}.` };
  }
}
