
'use server';

import { getFirestore, collection, addDoc, doc, deleteDoc, getDocs, getDoc, query, where, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';
import { Server, ServerAllocation } from '@/schemas/server';
import { initializeFirebase } from '@/lib/firebase';
import { cookies } from 'next/headers';

/**
 * Creates a new server.
 */
export async function createServer(serverData: Omit<Server, 'id' | 'createdOn' | 'expiresOn'>) {
  try {
    const { firestore } = initializeFirebase();
    const docRef = await addDoc(collection(firestore, 'servers'), {
      ...serverData,
      createdOn: serverTimestamp(),
      expiresOn: null,
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
        const createdOn = data.createdOn;
        const expiresOn = data.expiresOn;
        // Exclude privateIp and privateKey for security
        return {
            id: doc.id,
            name: data.name,
            publicIp: data.publicIp,
            serverType: data.serverType,
            provider: data.provider,
            portsOpen: data.portsOpen,
            isPrivate: data.isPrivate,
            createdOn: createdOn instanceof Timestamp ? createdOn.toDate().toISOString() : null,
            expiresOn: expiresOn instanceof Timestamp ? expiresOn.toDate().toISOString() : null,
        } as Server
    });
    return { success: true, servers };
  } catch (error: any) {
    return { success: false, error: 'Failed to fetch servers.' };
  }
}

/**
 * Fetches servers relevant to the current siteId by checking the serverAllocations collection.
 */
export async function getSiteServers(): Promise<{ success: boolean; servers?: (Server & { allocation: ServerAllocation })[]; error?: string }> {
  const cookieStore = cookies();
  const siteId = cookieStore.get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };

  try {
    const { firestore } = initializeFirebase();
    const allocationsQuery = query(collection(firestore, 'serverAllocations'), where('siteId', '==', siteId));
    const allocationsSnapshot = await getDocs(allocationsQuery);

    if (allocationsSnapshot.empty) {
        return { success: true, servers: [] };
    }

    const serverPromises = allocationsSnapshot.docs.map(async (allocDoc) => {
        const allocationData = allocDoc.data() as Omit<ServerAllocation, 'id'>;
        const serverDoc = await getDoc(doc(firestore, 'servers', allocationData.serverId));
        
        if (serverDoc.exists()) {
            const serverData = serverDoc.data();
            const createdOn = serverData.createdOn;
            
            const serverInfo: Server = {
                id: serverDoc.id,
                name: serverData.name,
                publicIp: serverData.publicIp,
                createdOn: createdOn instanceof Timestamp ? createdOn.toDate().toISOString() : null,
            };

            const allocation: ServerAllocation = {
                id: allocDoc.id,
                ...allocationData,
                allocatedOn: allocationData.allocatedOn instanceof Timestamp ? allocationData.allocatedOn.toDate().toISOString() : null,
                expiresOn: allocationData.expiresOn instanceof Timestamp ? allocationData.expiresOn.toDate().toISOString() : null,
            }
            
            return { ...serverInfo, allocation };
        }
        return null;
    });

    const servers = (await Promise.all(serverPromises)).filter(s => s !== null) as (Server & { allocation: ServerAllocation })[];
    
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
        const createdOn = data.createdOn;
        const expiresOn = data.expiresOn;
        // Exclude privateIp and privateKey for security
        const server: Server = { 
            id: docSnap.id, 
            name: data.name,
            publicIp: data.publicIp,
            privateIp: data.privateIp,
            serverType: data.serverType,
            provider: data.provider,
            portsOpen: data.portsOpen,
            isPrivate: data.isPrivate,
            createdOn: createdOn instanceof Timestamp ? createdOn.toDate().toISOString() : null,
            expiresOn: expiresOn instanceof Timestamp ? expiresOn.toDate().toISOString() : null,
        };
        return { success: true, server };
    } catch (error: any) {
        return { success: false, error: 'Failed to fetch server.' };
    }
}

/**
 * Fetches a single server by its ID, including private fields.
 * This should only be used in server-side actions where credentials are required.
 */
export async function getPrivateServerDetails(id: string): Promise<{ success: boolean, server?: Server, error?: string }> {
    try {
        const { firestore } = initializeFirebase();
        const serverRef = doc(firestore, 'servers', id);
        const docSnap = await getDoc(serverRef);

        if (!docSnap.exists()) {
            return { success: false, error: 'Server not found.' };
        }
        
        const data = docSnap.data();
        const createdOn = data.createdOn;
        const expiresOn = data.expiresOn;
        
        const server: Server = { 
            id: docSnap.id, 
            name: data.name,
            publicIp: data.publicIp,
            privateIp: data.privateIp,
            privateKey: data.privateKey,
            serverType: data.serverType,
            provider: data.provider,
            portsOpen: data.portsOpen,
            isPrivate: data.isPrivate,
            createdOn: createdOn instanceof Timestamp ? createdOn.toDate().toISOString() : null,
            expiresOn: expiresOn instanceof Timestamp ? expiresOn.toDate().toISOString() : null,
        };
        return { success: true, server };
    } catch (error: any) {
        return { success: false, error: 'Failed to fetch server details.' };
    }
}

/**
 * Updates a server. Allows overriding privateKey and privateIp without fetching them.
 */
export async function updateServer(id: string, serverData: Partial<Omit<Server, 'id' | 'createdOn'>>) {
  try {
    const { firestore } = initializeFirebase();
    const serverRef = doc(firestore, 'servers', id);

    const dataToUpdate: Record<string, any> = {
        name: serverData.name,
        publicIp: serverData.publicIp,
        serverType: serverData.serverType,
        provider: serverData.provider,
        portsOpen: serverData.portsOpen,
        isPrivate: serverData.isPrivate,
        expiresOn: serverData.expiresOn ? new Date(serverData.expiresOn) : null,
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
