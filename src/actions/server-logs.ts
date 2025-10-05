
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
  } catch (error: any) {
    logErrorToFirestore({
        message: `Failed to create server log. Command: ${logData.command}. Error: ${JSON.stringify(error)}`,
        stack: error.stack,
        source: 'createServerLog',
    });
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
  } catch (error: any) {
     logErrorToFirestore({
        message: `Failed to update server log. Log ID: ${id}. Error: ${JSON.stringify(error)}`,
        stack: error.stack,
        source: 'updateServerLog',
    });
    return { success: false, error: 'Failed to update server log.' };
  }
}


/**
 * Fetches server logs with pagination.
 */
export async function getServerLogs({ serverId, page = 1, pageSize = 10 }: { serverId: string, page?: number, pageSize?: number }): Promise<{ logs?: ServerLog[], error?: string, hasMore?: boolean }> {
    console.log('[Action:getServerLogs] Starting to fetch logs for serverId:', serverId, `Page: ${page}`);
    try {
        const { firestore } = initializeFirebase();
        console.log('[Action:getServerLogs] Firestore initialized.');
        const logsRef = collection(firestore, 'serverLogs');
        
        let q = query(
            logsRef, 
            where('serverId', '==', serverId), 
            orderBy('initiatedAt', 'desc')
        );
        console.log(`[Action:getServerLogs] Base query created for serverId: ${serverId}`);

        if (page > 1) {
            console.log(`[Action:getServerLogs] Paginating to page ${page}.`);
            const prevPageQuery = query(q, limit((page - 1) * pageSize));
            const prevPageSnapshot = await getDocs(prevPageQuery);
            if (!prevPageSnapshot.empty) {
                const lastVisible = prevPageSnapshot.docs[prevPageSnapshot.docs.length - 1];
                q = query(q, startAfter(lastVisible));
                console.log('[Action:getServerLogs] Query updated with startAfter cursor.');
            } else {
                 console.log('[Action:getServerLogs] Previous page snapshot was empty, cannot paginate further.');
            }
        }
        
        q = query(q, limit(pageSize + 1)); // Fetch one extra to check if there's a next page
        console.log('[Action:getServerLogs] Final query limit set. Executing getDocs...');

        const querySnapshot = await getDocs(q);
        console.log(`[Action:getServerLogs] getDocs executed. Found ${querySnapshot.docs.length} documents.`);
        
        const logs = querySnapshot.docs.slice(0, pageSize).map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                serverId: data.serverId,
                command: data.command,
                output: data.output,
                status: data.status,
                initiatedBy: data.initiatedBy,
                initiatedAt: data.initiatedAt instanceof Timestamp ? data.initiatedAt.toDate().toISOString() : null,
                completedAt: data.completedAt instanceof Timestamp ? data.completedAt.toDate().toISOString() : null,
            } as ServerLog;
        });

        const hasMore = querySnapshot.docs.length > pageSize;
        console.log(`[Action:getServerLogs] Processed ${logs.length} logs. Has more pages: ${hasMore}`);
        
        const result = { logs, hasMore, success: true };
        console.log('[Action:getServerLogs] Returning successful result:', result);
        return result;

    } catch (e: any) {
        console.error('[Action:getServerLogs] An error occurred:', e);
        // Log the entire error object for better debugging
        logErrorToFirestore({
            message: `Failed to fetch server logs for serverId: ${serverId}. Error: ${JSON.stringify(e)}`,
            stack: e.stack,
            source: 'getServerLogs',
        });
        // Return a more user-friendly error message, as the detailed error is logged to Firestore
        const errorResult = { error: 'Failed to load logs. Please check the error logs for more details.', success: false };
        console.log('[Action:getServerLogs] Returning error result:', errorResult);
        return errorResult;
    }
}
