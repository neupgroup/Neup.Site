
'use server';

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/lib/firebase';
import type { LogErrorParams } from '@/schemas/logging';

export async function logErrorToFirestore(params: LogErrorParams): Promise<{ success: boolean, error?: string }> {
    try {
        const { firestore } = initializeFirebase();
        if (!firestore) {
            throw new Error("Firestore is not initialized.");
        }
        await addDoc(collection(firestore, 'errors'), {
            ...params,
            timestamp: serverTimestamp(),
        });
        return { success: true };
    } catch (e: any) {
        console.error("Failed to log error to Firestore:", e);
        return { success: false, error: e.message };
    }
}
