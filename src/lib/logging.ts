
'use server';

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/lib/firebase';
import type { LogErrorParams } from '@/schemas/logging';

export async function logErrorToFirestore(params: LogErrorParams): Promise<{ success: boolean, error?: string }> {
    try {
        const { firestore } = initializeFirebase();
        if (!firestore) {
            // This case should be rare since initializeFirebase now handles its own errors
            throw new Error("Firestore is not initialized and initialization failed.");
        }
        await addDoc(collection(firestore, 'errors'), {
            ...params,
            timestamp: serverTimestamp(),
        });
        return { success: true };
    } catch (e: any) {
        // Log to the server console as a last resort if logging to Firestore fails.
        console.error("CRITICAL: Failed to log error to Firestore:", e);
        console.error("Original Error to be Logged:", params);
        // We don't throw or log to Firestore again to prevent infinite loops.
        return { success: false, error: e.message };
    }
}
