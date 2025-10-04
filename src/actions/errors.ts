
'use server';

import { adminDb } from '@/lib/firebase-admin';
import { collection, getDocs, query, orderBy, limit, Timestamp } from 'firebase/firestore';

export interface ErrorLog {
  id: string;
  message: string;
  source?: string;
  stack?: string;
  timestamp: string;
}

export async function getErrorLogsAction(): Promise<{ logs?: ErrorLog[], error?: string }> {
    try {
        const errorsCollection = collection(adminDb, 'errors');
        const q = query(errorsCollection, orderBy('timestamp', 'desc'), limit(50));
        const errorSnapshot = await getDocs(q);
        const errorsList = errorSnapshot.docs.map(doc => {
          const data = doc.data();
          const timestamp = data.timestamp as Timestamp;
          return {
            id: doc.id,
            message: data.message,
            source: data.source,
            stack: data.stack,
            timestamp: timestamp?.toDate().toISOString() || new Date().toISOString(),
          };
        });
        return { logs: errorsList };
    } catch (e: any) {
        console.error("Error fetching errors: ", e);
        if (e.code === 'permission-denied') {
            return { error: "Permission denied. Please check your Firestore security rules in the Firebase Console." };
        }
        if (e.message.includes('FIRESTORE_PROJECT_ID') || e.message.includes('default Firebase app does not exist')) {
             return { error: 'Firebase project not configured on the server. Please check your service account setup.' };
        }
        return { error: 'An unexpected error occurred while fetching error logs.' };
    }
}
