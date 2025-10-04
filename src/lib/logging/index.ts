
'use server';

import { getAdminDb } from '@/lib/firebase/firebase-admin';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

type ErrorLog = {
    message: string;
    stack?: string;
    source: string; // e.g., 'saveSite', 'getSite', 'uploadFile'
};

export async function logErrorToFirestore(errorLog: ErrorLog) {
    try {
        const adminDb = getAdminDb();
        const logCollectionRef = collection(adminDb, 'errorLogs');
        await addDoc(logCollectionRef, {
            ...errorLog,
            createdAt: serverTimestamp(),
        });
    } catch (dbError: any) {
        console.error('Failed to log error to Firestore:', dbError);
        // Also log the original error to the console as a fallback
        console.error('Original error:', errorLog.message, { stack: errorLog.stack, source: errorLog.source });
    }
}
