
'use server';

import { db } from '@/lib/firebase';
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
} from 'firebase/firestore';
import { logErrorToFirestore } from './logging';
import { cookies } from 'next/headers';

export interface Server {
  id: string;
  siteId: string;
  name: string;
  publicIp: string;
  privateIp?: string; // Not fetched for display
  publicKey: string;
  privateKey?: string; // Not fetched for display
  createdAt?: string | null;
}

/**
 * Creates a new server.
 */
export async function createServer(serverData: Omit<Server, 'id' | 'createdAt' | 'siteId'>) {
  const siteId = cookies().get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };

  try {
    const docRef = await addDoc(collection(db, 'servers'), {
      ...serverData,
      siteId,
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
 * Fetches all servers for the current siteId, excluding private fields.
 */
export async function getServers(): Promise<{ success: boolean; servers?: Server[]; error?: string }> {
  const siteId = cookies().get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };

  try {
    const q = query(collection(db, 'servers'), where('siteId', '==', siteId));
    const querySnapshot = await getDocs(q);
    const servers = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const createdAt = data.createdAt;
        // Exclude privateIp and privateKey for security
        return {
            id: doc.id,
            siteId: data.siteId,
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
    const siteId = cookies().get('siteId')?.value;
    if (!siteId) return { success: false, error: 'Site ID not found.' };
    
    try {
        const serverRef = doc(db, 'servers', id);
        const docSnap = await getDoc(serverRef);

        if (!docSnap.exists() || docSnap.data().siteId !== siteId) {
            return { success: false, error: 'Server not found or unauthorized.' };
        }
        
        const data = docSnap.data();
        const createdAt = data.createdAt;
        // Exclude privateIp and privateKey for security
        const server: Server = { 
            id: docSnap.id, 
            siteId: data.siteId,
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
export async function updateServer(id: string, serverData: Partial<Omit<Server, 'id' | 'createdAt' | 'siteId'>>) {
  const siteId = cookies().get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };

  try {
    const serverRef = doc(db, 'servers', id);
    const serverSnap = await getDoc(serverRef);
    if (!serverSnap.exists() || serverSnap.data().siteId !== siteId) {
        return { success: false, error: 'Unauthorized' };
    }

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

    await setDoc(serverRef, dataToUpdate, { merge: true });
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
  const siteId = cookies().get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };
  
  try {
    const serverRef = doc(db, 'servers', id);
    const serverSnap = await getDoc(serverRef);

    if (!serverSnap.exists() || serverSnap.data().siteId !== siteId) {
        return { success: false, error: 'Unauthorized' };
    }
    
    await deleteDoc(serverRef);
    return { success: true };
  } catch (error: any) {
    await logErrorToFirestore({
      message: `Failed to delete server with ID ${id}: ` + error.message,
      stack: error.stack,
    });
    return { success: false, error: 'Failed to delete server.' };
  }
}
