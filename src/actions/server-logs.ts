
'use server';

import { getFirestore, collection, getDocs, orderBy, query, limit, startAfter, DocumentSnapshot, doc, getDoc, addDoc, serverTimestamp, Timestamp, where } from 'firebase/firestore';
import { initializeFirebase } from '@/lib/firebase';
import type { ServerLog } from '@/schemas/server';

/**
 * Creates a new server log entry.
 */
export async function createServerLog(logData: Omit<ServerLog, 'id' | 'timestamp'>): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { firestore } = initializeFirebase();
    const docRef = await addDoc(collection(firestore, 'serverLogs'), {
      ...logData,
      timestamp: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error: any) {
    return { success: false, error: 'Failed to create server log.' };
  }
}

/**
 * Fetches server logs with pagination.
 */
export async function getServerLogs({ serverId, page = 1, pageSize = 10 }: { serverId: string, page?: number, pageSize?: number }): Promise<{ logs?: ServerLog[], error?: string, hasMore?: boolean }> {
    try {
        const { firestore } = initializeFirebase();
        const logsRef = collection(firestore, 'serverLogs');
        
        let q = query(
            logsRef, 
            where('serverId', '==', serverId), 
            orderBy('timestamp', 'desc')
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
                output: data.output,
                status: data.status,
                timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate().toISOString() : null,
            } as ServerLog;
        });

        const hasMore = querySnapshot.docs.length > pageSize;

        return { logs, hasMore };
    } catch (e: any) {
        console.error('Failed to fetch server logs:', e);
        return { error: e.message || 'Unknown error occurred while fetching logs. This might be due to a missing Firestore index.' };
    }
}
