

'use server';

import { getFirestore, collection, addDoc, doc, deleteDoc, getDocs, getDoc, query, where, serverTimestamp, setDoc, Timestamp } from '@/lib/firestore';
import { Server, ServerAllocation } from '@/schemas/server';
import { getDataStore } from '@/lib/data-store';
import { cookies } from 'next/headers';
import { logErrorToDatabase } from '@/lib/logging';

/**
 * Creates a new server.
 */
export async function createServer(serverData: Omit<Server, 'id' | 'createdOn' | 'expiresOn'>) {
  try {
    const { firestore } = getDataStore();
    const docRef = await addDoc(collection(firestore, 'servers'), {
      ...serverData,
      serverConfigured: false, // Default to not configured
      createdOn: serverTimestamp(),
      expiresOn: null,
    });
    return { success: true, id: docRef.id };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to create server: ${e.message}`, stack: e.stack, source: 'createServer' });
    return { success: false, error: 'Failed to create server.' };
  }
}

/**
 * Fetches all servers, excluding private fields.
 */
export async function getServers(): Promise<{ success: boolean; servers?: Server[]; error?: string }> {
  try {
    const { firestore } = getDataStore();
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
        platform: data.platform,
        provider: data.provider,
        isPrivate: data.isPrivate,
        username: data.username,
        basePath: data.basePath,
        appPath: data.appPath,
        serverConfigured: data.serverConfigured || false,
        createdOn: createdOn instanceof Timestamp ? createdOn.toDate().toISOString() : null,
        expiresOn: expiresOn instanceof Timestamp ? expiresOn.toDate().toISOString() : null,
      } as Server
    });
    return { success: true, servers };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to get servers: ${e.message}`, stack: e.stack, source: 'getServers' });
    return { success: false, error: 'Failed to fetch servers.' };
  }
}

/**
 * Fetches servers relevant to the current artifactId by checking the serverAllocations collection.
 */
export async function getSiteServers(): Promise<{ success: boolean; servers?: (Server & { allocation: ServerAllocation })[]; error?: string }> {
  const cookieStore = await cookies();
  const artifactId = cookieStore.get('artifactId')?.value;
  if (!artifactId) return { success: false, error: 'Artifact ID not found.' };

  try {
    const { firestore } = getDataStore();
    const allocationsQuery = query(collection(firestore, 'allocations'), where('artifactId', '==', artifactId));
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
          serverConfigured: serverData.serverConfigured || false,
          createdOn: createdOn instanceof Timestamp ? createdOn.toDate().toISOString() : null,
        };

        const allocation: ServerAllocation = {
          id: allocDoc.id,
          ...allocationData,
          allocatedOn: (allocationData.allocatedOn as any) instanceof Timestamp ? (allocationData.allocatedOn as any).toDate().toISOString() : null,
        }

        return { ...serverInfo, allocation };
      }
      return null;
    });

    const servers = (await Promise.all(serverPromises)).filter(s => s !== null) as (Server & { allocation: ServerAllocation })[];

    return { success: true, servers };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to get site servers: ${e.message}`, stack: e.stack, source: 'getSiteServers' });
    return { success: false, error: 'Failed to fetch site-specific servers.' };
  }
}


/**
 * Fetches a single server by its ID, excluding private fields.
 */
export async function getServer(id: string): Promise<{ success: boolean, server?: Server, error?: string }> {
  try {
    const { firestore } = getDataStore();
    const serverRef = doc(firestore, 'servers', id);
    const docSnap = await getDoc(serverRef);

    if (!docSnap.exists()) {
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
      platform: data.platform,
      provider: data.provider,
      isPrivate: data.isPrivate,
      username: data.username,
      basePath: data.basePath,
      appPath: data.appPath,
      serverConfigured: data.serverConfigured || false,
      createdOn: createdOn instanceof Timestamp ? createdOn.toDate().toISOString() : null,
      expiresOn: expiresOn instanceof Timestamp ? expiresOn.toDate().toISOString() : null,
    };
    return { success: true, server };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to get server ${id}: ${e.message}`, stack: e.stack, source: 'getServer' });
    return { success: false, error: 'Failed to fetch server.' };
  }
}

/**
 * Fetches a single server by its ID, including private fields.
 * This should only be used in server-side actions where credentials are required.
 */
export async function getPrivateServerDetails(id: string): Promise<{ success: boolean, server?: Server, error?: string }> {
  try {
    const { firestore } = getDataStore();
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
      platform: data.platform,
      provider: data.provider,
      isPrivate: data.isPrivate,
      username: data.username,
      basePath: data.basePath,
      appPath: data.appPath,
      serverConfigured: data.serverConfigured || false,
      createdOn: createdOn instanceof Timestamp ? createdOn.toDate().toISOString() : null,
      expiresOn: expiresOn instanceof Timestamp ? expiresOn.toDate().toISOString() : null,
    };
    return { success: true, server };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to get private server details for ${id}: ${e.message}`, stack: e.stack, source: 'getPrivateServerDetails' });
    return { success: false, error: 'Failed to fetch server details.' };
  }
}

/**
 * Updates a server. Allows overriding privateKey and privateIp without fetching them.
 */
export async function updateServer(id: string, serverData: Partial<Omit<Server, 'id' | 'createdOn'>>) {
  try {
    const { firestore } = getDataStore();
    const serverRef = doc(firestore, 'servers', id);

    const dataToUpdate: Record<string, any> = { ...serverData };

    // Only include private fields if they are explicitly provided and not empty
    if (!serverData.privateIp) {
      delete dataToUpdate.privateIp;
    }
    if (!serverData.privateKey) {
      delete dataToUpdate.privateKey;
    }

    await setDoc(serverRef, dataToUpdate, { merge: true });
    return { success: true, id };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to update server ${id}: ${e.message}`, stack: e.stack, source: 'updateServer' });
    return { success: false, error: `Failed to update server ${id}.` };
  }
}

/**
 * Deletes a server.
 */
export async function deleteServer(id: string) {
  try {
    const { firestore } = getDataStore();
    const serverRef = doc(firestore, 'servers', id);
    await deleteDoc(serverRef);
    return { success: true };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to delete server ${id}: ${e.message}`, stack: e.stack, source: 'deleteServer' });
    return { success: false, error: 'Failed to delete server.' };
  }
}
