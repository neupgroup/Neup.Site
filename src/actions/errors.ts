
'use server';

import { getFirestore, collection, getDocs, orderBy, query, limit, getCountFromServer, startAfter, DocumentSnapshot, doc } from 'firebase/firestore';
import { initializeFirebase } from '@/lib/firebase';

export interface ErrorLog {
    id: string;
    message: string;
    stack?: string;
    source?: string;
    timestamp: string;
}

export async function getErrorLogsAction({ page = 1, pageSize = 10 }: { page?: number, pageSize?: number }): Promise<{ logs?: ErrorLog[], error?: string, totalCount?: number }> {
    try {
        const { firestore } = initializeFirebase();
        const logsRef = collection(firestore, 'errors');
        
        // Get total count
        const countSnapshot = await getCountFromServer(logsRef);
        const totalCount = countSnapshot.data().count;

        let q;
        if (page > 1) {
            // To get the document to start after, we need to query for the last document of the previous page
            const prevPageQuery = query(logsRef, orderBy('timestamp', 'desc'), limit((page - 1) * pageSize));
            const prevPageSnapshot = await getDocs(prevPageQuery);
            const lastVisible = prevPageSnapshot.docs[prevPageSnapshot.docs.length - 1];
            q = query(logsRef, orderBy('timestamp', 'desc'), startAfter(lastVisible), limit(pageSize));
        } else {
            q = query(logsRef, orderBy('timestamp', 'desc'), limit(pageSize));
        }

        const querySnapshot = await getDocs(q);
        const logs = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                message: data.message,
                stack: data.stack,
                source: data.source,
                timestamp: data.timestamp.toDate().toISOString(),
            } as ErrorLog
        });
        return { logs, totalCount };
    } catch (e: any) {
        console.error('Failed to fetch error logs:', e);
        return { error: e.message || 'Unknown error occurred while fetching logs.' };
    }
}
