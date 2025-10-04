
'use server';

import { getFirestore, collection, getDocs, orderBy, query, limit } from 'firebase/firestore';
import { initializeFirebase } from '@/lib/firebase';

export interface ErrorLog {
    id: string;
    message: string;
    stack?: string;
    source?: string;
    timestamp: string;
}

export async function getErrorLogsAction(): Promise<{ logs?: ErrorLog[], error?: string }> {
    try {
        const { firestore } = initializeFirebase();
        const logsRef = collection(firestore, 'errors');
        const q = query(logsRef, orderBy('timestamp', 'desc'), limit(50));
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
        return { logs };
    } catch (e: any) {
        console.error('Failed to fetch error logs:', e);
        return { error: e.message || 'Unknown error occurred while fetching logs.' };
    }
}
