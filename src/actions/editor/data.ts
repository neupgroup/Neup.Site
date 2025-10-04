
'use server';

import { getFirestore, collection, doc, setDoc, getDoc, query, where, getDocs, limit } from 'firebase/firestore';
import { cookies } from 'next/headers';
import { PageDataSourceBinding } from '@/schemas/data';
import { initializeFirebase } from '@/lib/firebase';


/**
 * Sets or updates the data source binding for a specific page.
 */
export async function setPageDataSource(pageId: string, sourceId: string, methodName: string): Promise<{ success: boolean; id?: string; error?: string }> {
    const cookieStore = cookies();
    const siteId = cookieStore.get('siteId')?.value;
    if (!siteId) return { success: false, error: 'Site ID not found.' };

    try {
        const { firestore } = initializeFirebase();
        const bindingId = `${pageId}_${sourceId}`; // Create a deterministic ID
        const bindingRef = doc(firestore, 'page_data_sources', bindingId);
        
        await setDoc(bindingRef, {
            siteId,
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
    const cookieStore = cookies();
    const siteId = cookieStore.get('siteId')?.value;
    if (!siteId) return { success: false, error: 'Site ID not found.' };

    try {
        const { firestore } = initializeFirebase();
        const q = query(collection(firestore, 'page_data_sources'), where('pageId', '==', pageId), where('siteId', '==', siteId), limit(1));
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
