
'use server';

import { getAdminDb } from '@/lib/firebase/firebase-admin';
import {
  collection,
  addDoc,
  doc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  serverTimestamp,
  setDoc,
  Timestamp
} from 'firebase-admin/firestore';
import { logErrorToFirestore } from '@/lib/logging';
import { Server } from '@/schemas/server';

/**
 * Creates a new server.
 */
export async function createServer(serverData: Omit<Server, 'id' | 'createdAt'>) {
  try {
    const adminDb = getAdminDb();
    const docRef = await adminDb.collection('servers').add({
      ...serverData,
      createdAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error('Failed to create server:', error);
    await logErrorToFirestore({
      message: 'Failed to create server: ' + error.message,
      stack: error.stack,
    });
    return { success: false, error: 'Failed to create server.' };
  }
}

/**
 * Fetches all servers, excluding private fields.
 */
export async function getServers(): Promise<{ success: boolean; servers?: Server[]; error?: string }> {
  try {
    const adminDb = getAdminDb();
    const q = adminDb.collection('servers');
    const querySnapshot = await q.get();
    const servers = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const createdAt = data.createdAt;
        // Exclude privateIp and privateKey for security
        return {
            id: doc.id,
            name: data.name,
            publicIp: data.publicIp,
            publicKey: data.publicKey,
            createdAt: createdAt instanceof Timestamp ? createdAt.toDate().toISOString() : null,
        } as Server
    });
    return { success: true, servers };
  } catch (error: any) {
    console.error('Failed to fetch servers:', error);
    await logErrorToFirestore({
      message: 'Failed to fetch servers: ' + error.message,
      stack: error.stack,
    });
    return { success: false, error: 'Failed to fetch servers.' };
  }
}

/**
 * Fetches a single server by its ID, excluding private fields.
 */
export async function getServer(id: string): Promise<{ success: boolean, server?: Server, error?: string }> {
    try {
        const adminDb = getAdminDb();
        const serverRef = adminDb.collection('servers').doc(id);
        const docSnap = await serverRef.get();

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
            publicKey: data.publicKey,
            createdAt: createdAt instanceof Timestamp ? createdAt.toDate().toISOString() : null,
        };
        return { success: true, server };
    } catch (error: any) {
        await logErrorToFirestore({
            message: `Failed to fetch server with ID ${id}: ` + error.message,
            stack: error.stack,
        });
        return { success: false, error: 'Failed to fetch server.' };
    }
}

/**
 * Updates a server. Allows overriding privateKey and privateIp without fetching them.
 */
export async function updateServer(id: string, serverData: Partial<Omit<Server, 'id' | 'createdAt'>>) {
  try {
    const adminDb = getAdminDb();
    const serverRef = adminDb.collection('servers').doc(id);

    const dataToUpdate: Record<string, any> = {
        name: serverData.name,
        publicIp: serverData.publicIp,
        publicKey: serverData.publicKey
    };

    // Only include private fields if they are explicitly provided and not empty
    if (serverData.privateIp) {
        dataToUpdate.privateIp = serverData.privateIp;
    }
    if (serverData.privateKey) {
        dataToUpdate.privateKey = serverData.privateKey;
    }

    await serverRef.set(dataToUpdate, { merge: true });
    return { success: true, id };
  } catch (error: any) {
    await logErrorToFirestore({
      message: `Failed to update server ${id}: ` + error.message,
      stack: error.stack,
    });
    return { success: false, error: `Failed to update server ${id}.` };
  }
}

/**
 * Deletes a server.
 */
export async function deleteServer(id: string) {
  try {
    const adminDb = getAdminDb();
    const serverRef = adminDb.collection('servers').doc(id);
    await serverRef.delete();
    return { success: true };
  } catch (error: any) {
    await logErrorToFirestore({
      message: `Failed to delete server with ID ${id}: ` + error.message,
      stack: error.stack,
    });
    return { success: false, error: 'Failed to delete server.' };
  }
}
