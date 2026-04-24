
'use server';

import { getFirestore, collection, doc, setDoc, getDoc, query, where, getDocs, limit } from '@/lib/firestore';
import { cookies } from 'next/headers';
import { PageDataSourceBinding } from '@/schemas/data';
import { getDataStore } from '@/lib/data-store';


/**
 * Sets or updates the data source binding for a specific page.
 */
export async function setPageDataSource(pageId: string, sourceId: string, methodName: string): Promise<{ success: boolean; id?: string; error?: string }> {
    const cookieStore = await cookies();
    const artifactId = cookieStore.get('artifactId')?.value;
    if (!artifactId) return { success: false, error: 'Artifact ID not found.' };

    try {
        const { firestore } = getDataStore();
        const bindingId = `${pageId}_${sourceId}`; // Create a deterministic ID
        const bindingRef = doc(firestore, 'page_data_sources', bindingId);

        await setDoc(bindingRef, {
            artifactId,
            pageId,
            sourceId,
            methodName,
        });

        return { success: true, id: bindingId };
    } catch (error: any) {
        return { success: false, error: 'Failed to link data source.' };
    }
}


/**
 * Fetches the data source binding for a specific page.
 */
export async function getPageDataSource(pageId: string): Promise<{ success: boolean; binding?: PageDataSourceBinding; error?: string }> {
    const cookieStore = await cookies();
    const artifactId = cookieStore.get('artifactId')?.value;
    if (!artifactId) return { success: false, error: 'Artifact ID not found.' };

    try {
        const { firestore } = getDataStore();
        const q = query(collection(firestore, 'page_data_sources'), where('pageId', '==', pageId), where('artifactId', '==', artifactId), limit(1));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return { success: true, binding: undefined };
        }

        const doc = querySnapshot.docs[0];
        const binding = { id: doc.id, ...doc.data() } as PageDataSourceBinding;

        return { success: true, binding };
    } catch (error: any) {
        return { success: false, error: 'Failed to fetch data source link.' };
    }
}
