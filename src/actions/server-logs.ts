

'use server';

import { getFirestore, collection, getDocs, orderBy, query, limit, startAfter, doc, getDoc, addDoc, setDoc, serverTimestamp, Timestamp, where } from 'firebase/firestore';
import { initializeFirebase } from '@/lib/firebase';
import type { ServerLog } from '@/schemas/server';
import { logErrorToFirestore } from '@/lib/logging';

/**
 * Creates a new server log entry.
 */
export async function createServerLog(logData: Omit<ServerLog, 'id' | 'initiatedAt' | 'completedAt'>): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { firestore } = initializeFirebase();
    const docRef = await addDoc(collection(firestore, 'serverLogs'), {
      ...logData,
      initiatedBy: 'system', // Placeholder for user auth
      initiatedAt: serverTimestamp(),
      completedAt: null,
    });
    return { success: true, id: docRef.id };
  } catch (e: any) {
    // Cannot log to Firestore here as it might cause an infinite loop if logging itself fails
    console.error("CRITICAL: Failed to create server log.", e);
    return { success: false, error: 'Failed to create server log.' };
  }
}

/**
 * Updates an existing server log entry.
 */
export async function updateServerLog(id: string, logData: Partial<Omit<ServerLog, 'id' | 'initiatedAt'>>): Promise<{ success: boolean; error?: string }> {
  try {
    const { firestore } = initializeFirebase();
    const logRef = doc(firestore, 'serverLogs', id);

    let dataToUpdate: Record<string, any> = { ...logData };
    if (logData.status === 'completed' || logData.status === 'failed' || logData.status === 'cancelled') {
        dataToUpdate.completedAt = serverTimestamp();
    }
    await setDoc(logRef, dataToUpdate, { merge: true });
    return { success: true };
  } catch (e: any) {
     // Cannot log to Firestore here as it might cause an infinite loop if logging itself fails
    console.error(`CRITICAL: Failed to update server log ${id}.`, e);
    // Don't return an error here, as this is often called in a non-critical path
    // and we don't want to stop the main flow for a logging error.
    return { success: false, error: e.message };
  }
}

/**
 * Fetches a single server log by its ID.
 */
export async function getServerLog(id: string): Promise<{ success: boolean; log?: ServerLog; error?: string }> {
    try {
        const { firestore } = initializeFirebase();
        const docRef = doc(firestore, 'serverLogs', id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return { success: false, error: 'Log not found.' };
        }

        const data = docSnap.data();
        const log: ServerLog = {
            id: docSnap.id,
            serverId: data.serverId,
            command: data.command,
            commandId: data.commandId,
            commandName: data.commandName,
            output: data.output,
            status: data.status,
            initiatedBy: data.initiatedBy,
            initiatedAt: data.initiatedAt instanceof Timestamp ? data.initiatedAt.toDate().toISOString() : null,
            completedAt: data.completedAt instanceof Timestamp ? data.completedAt.toDate().toISOString() : null,
        };
        return { success: true, log };

    } catch (e: any) {
        // This action is used for polling, so logging to Firestore might be too noisy.
        // Console error is sufficient for developers to debug.
        console.error(`Failed to get server log ${id}:`, e);
        return { success: false, error: 'Failed to fetch log.' };
    }
}


/**
 * Fetches server logs with pagination.
 */
export async function getServerLogs({ serverId, page = 1, pageSize = 10 }: { serverId: string, page?: number, pageSize?: number }): Promise<{ logs?: ServerLog[], error?: string, hasMore?: boolean, success: boolean }> {
    try {
        const { firestore } = initializeFirebase();
        const logsRef = collection(firestore, 'serverLogs');
        
        let q = query(
            logsRef, 
            where('serverId', '==', serverId), 
            orderBy('initiatedAt', 'desc')
        );

        if (page > 1) {
            const prevPageQuery = query(q, limit((page - 1) * pageSize));
            const prevPageSnapshot = await getDocs(prevPageQuery);
            if (!prevPageSnapshot.empty) {
                const lastVisible = prevPageSnapshot.docs[prevPageSnapshot.docs.length - 1];
                q = query(q, startAfter(lastVisible));
            }
        }
        
        q = query(q, limit(pageSize + 1)); // Fetch one extra to check if there's a next page

        const querySnapshot = await getDocs(q);
        
        const logs = querySnapshot.docs.slice(0, pageSize).map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                serverId: data.serverId,
                command: data.command,
                commandId: data.commandId,
                commandName: data.commandName,
                output: data.output,
                status: data.status,
                initiatedBy: data.initiatedBy,
                initiatedAt: data.initiatedAt instanceof Timestamp ? data.initiatedAt.toDate().toISOString() : null,
                completedAt: data.completedAt instanceof Timestamp ? data.completedAt.toDate().toISOString() : null,
            } as ServerLog;
        });

        const hasMore = querySnapshot.docs.length > pageSize;
        
        return { logs, hasMore, success: true };

    } catch (e: any) {
        await logErrorToFirestore({ message: `Failed to fetch server logs for serverId: ${serverId}: ${e.message}`, stack: e.stack, source: 'getServerLogs' });
        return { error: 'Failed to load logs. Please check the error logs for more details.', success: false };
    }
}
