
'use server';

import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { cookies } from 'next/headers';
import { initializeFirebase } from '@/lib/firebase';
import { logErrorToFirestore } from '@/lib/logging';
import { markEnvironmentsAsPending } from './structure';
import type { EnvironmentVariable, Structure } from '@/schemas/site';

/**
 * Fetches the environment variables for the current site from the structure document.
 */
export async function getEnvironmentVariables(): Promise<{ success: boolean; variables?: EnvironmentVariable[]; error?: string }> {
    const cookieStore = await cookies();
    const siteId = cookieStore.get('siteId')?.value;
    if (!siteId) return { success: false, error: 'Site ID not found.' };

    try {
        const { firestore } = initializeFirebase();
        const structureRef = doc(firestore, 'structure', siteId);
        const docSnap = await getDoc(structureRef);

        if (!docSnap.exists()) {
            return { success: true, variables: [] };
        }

        const data = docSnap.data() as Structure;
        return { success: true, variables: data.environments || [] };
    } catch (e: any) {
        await logErrorToFirestore({ message: `Failed to get environment variables: ${e.message}`, stack: e.stack, source: 'getEnvironmentVariables' });
        return { success: false, error: 'Failed to fetch environment variables.' };
    }
}

/**
 * Updates the environment variables for the current site in the structure document.
 */
export async function updateEnvironmentVariables(variables: EnvironmentVariable[]): Promise<{ success: boolean; error?: string }> {
    const cookieStore = await cookies();
    const siteId = cookieStore.get('siteId')?.value;
    if (!siteId) return { success: false, error: 'Site ID not found.' };

    try {
        const { firestore } = initializeFirebase();
        const structureRef = doc(firestore, 'structure', siteId);
        
        await setDoc(structureRef, {
            environments: variables,
            updatedAt: serverTimestamp(),
        }, { merge: true });

        await markEnvironmentsAsPending(siteId);

        return { success: true };
    } catch (e: any) {
        await logErrorToFirestore({ message: `Failed to update environment variables: ${e.message}`, stack: e.stack, source: 'updateEnvironmentVariables' });
        return { success: false, error: 'Failed to update environment variables.' };
    }
}
