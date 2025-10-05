
'use server';

import { getFirestore, collection, addDoc, doc, deleteDoc, getDocs, getDoc, query, where, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';
import { Server, ServerAllocation } from '@/schemas/server';
import { initializeFirebase } from '@/lib/firebase';
import { cookies } from 'next/headers';

/**
 * Creates a new server.
 */
export async function createServer(serverData: Omit<Server, 'id' | 'createdAt'>) {
  try {
    const { firestore } = initializeFirebase();
    const docRef = await addDoc(collection(firestore, 'servers'), {
      ...serverData,
      createdAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error: any) {
    return { success: false, error: 'Failed to create server.' };
  }
}

/**
 * Fetches all servers, excluding private fields.
 */
export async function getServers(): Promise<{ success: boolean; servers?: Server[]; error?: string }> {
  try {
    const { firestore } = initializeFirebase();
    const q = query(collection(firestore, 'servers'));
    const querySnapshot = await getDocs(q);
    const servers = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const createdAt = data.createdAt;
        // Exclude privateIp and privateKey for security
        return {
            id: doc.id,
            name: data.name,
            publicIp: data.publicIp,
            type: data.type || 'private',
            allocations: data.allocations || [],
            createdAt: createdAt instanceof Timestamp ? createdAt.toDate().toISOString() : null,
        } as Server
    });
    return { success: true, servers };
  } catch (error: any) {
    return { success: false, error: 'Failed to fetch servers.' };
  }
}

/**
 * Fetches servers relevant to the current siteId.
 */
export async function getSiteServers(): Promise<{ success: boolean; servers?: Server[]; error?: string }> {
  const cookieStore = cookies();
  const siteId = cookieStore.get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };

  try {
    const { firestore } = initializeFirebase();
    const q = query(collection(firestore, 'servers'), where('allocations', 'array-contains', { siteId: siteId }));
    const querySnapshot = await getDocs(q);
    
    const servers = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const createdAt = data.createdAt;
        
        const siteAllocation = data.allocations?.find((alloc: ServerAllocation) => alloc.siteId === siteId);

        return {
            id: doc.id,
            name: data.name,
            publicIp: data.publicIp,
            type: data.type || 'private',
            allocations: siteAllocation ? [siteAllocation] : [], // Only return the allocation for the current site
            createdAt: createdAt instanceof Timestamp ? createdAt.toDate().toISOString() : null,
        } as Server
    });
    return { success: true, servers };
  } catch (error: any) {
    return { success: false, error: 'Failed to fetch site-specific servers.' };
  }
}


/**
 * Fetches a single server by its ID, excluding private fields.
 */
export async function getServer(id: string): Promise<{ success: boolean, server?: Server, error?: string }> {
    try {
        const { firestore } = initializeFirebase();
        const serverRef = doc(firestore, 'servers', id);
        const docSnap = await getDoc(serverRef);

        if (!docSnap.exists) {
            return { success: false, error: 'Server not found or unauthorized.' };
        }
        
        const data = docSnap.data()!;
        const createdAt = data.createdAt;
        // Exclude privateIp and privateKey for security
        const server: Server = { 
            id: docSnap.id, 
            name: data.name,
            publicIp: data.publicIp,
            type: data.type || 'private',
            allocations: data.allocations || [],
            createdAt: createdAt instanceof Timestamp ? createdAt.toDate().toISOString() : null,
        };
        return { success: true, server };
    } catch (error: any) {
        return { success: false, error: 'Failed to fetch server.' };
    }
}

/**
 * Updates a server. Allows overriding privateKey and privateIp without fetching them.
 */
export async function updateServer(id: string, serverData: Partial<Omit<Server, 'id' | 'createdAt'>>) {
  try {
    const { firestore } = initializeFirebase();
    const serverRef = doc(firestore, 'servers', id);

    const dataToUpdate: Record<string, any> = {
        name: serverData.name,
        publicIp: serverData.publicIp,
        type: serverData.type,
        allocations: serverData.allocations || [],
    };

    // Only include private fields if they are explicitly provided and not empty
    if (serverData.privateIp) {
        dataToUpdate.privateIp = serverData.privateIp;
    }
    if (serverData.privateKey) {
        dataToUpdate.privateKey = serverData.privateKey;
    }
    
    await setDoc(serverRef, dataToUpdate, { merge: true });
    return { success: true, id };
  } catch (error: any) {
    return { success: false, error: `Failed to update server ${id}.` };
  }
}

/**
 * Deletes a server.
 */
export async function deleteServer(id: string) {
  try {
    const { firestore } = initializeFirebase();
    const serverRef = doc(firestore, 'servers', id);
    await deleteDoc(serverRef);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'Failed to delete server.' };
  }
}
