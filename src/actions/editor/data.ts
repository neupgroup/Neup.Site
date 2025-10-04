
'use server';

import { adminDb } from '@/lib/firebase-admin';
import { collection, doc, setDoc, getDoc, query, where, getDocs, limit } from 'firebase/firestore';
import { logErrorToFirestore } from '../logging';
import { cookies } from 'next/headers';


export interface PageDataSourceBinding {
    id: string;
    siteId: string; // The cookie siteId
    pageId: string; // The page document ID
    sourceId: string;
    methodName: string;
}


/**
 * Sets or updates the data source binding for a specific page.
 */
export async function setPageDataSource(pageId: string, sourceId: string, methodName: string): Promise<{ success: boolean; id?: string; error?: string }> {
    const siteId = cookies().get('siteId')?.value;
    if (!siteId) return { success: false, error: 'Site ID not found.' };

    try {
        const bindingId = `${pageId}_${sourceId}`; // Create a deterministic ID
        const bindingRef = doc(adminDb, 'page_data_sources', bindingId);
        
        await setDoc(bindingRef, {
            siteId,
            pageId,
            sourceId,
            methodName,
        });

        return { success: true, id: bindingId };
    } catch (error: any) {
        console.error(`Failed to set page data source for page ${pageId}:`, error);
        await logErrorToFirestore({
            message: `Failed to set page data source for page ${pageId}: ` + error.message,
            stack: error.stack,
        });
        return { success: false, error: 'Failed to link data source.' };
    }
}


/**
 * Fetches the data source binding for a specific page.
 */
export async function getPageDataSource(pageId: string): Promise<{ success: boolean; binding?: PageDataSourceBinding; error?: string }> {
    const siteId = cookies().get('siteId')?.value;
    if (!siteId) return { success: false, error: 'Site ID not found.' };

    try {
        const q = query(collection(adminDb, 'page_data_sources'), where('pageId', '==', pageId), where('siteId', '==', siteId), limit(1));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return { success: true, binding: undefined };
        }

        const doc = querySnapshot.docs[0];
        const binding = { id: doc.id, ...doc.data() } as PageDataSourceBinding;

        return { success: true, binding };
    } catch (error: any) {
        console.error(`Failed to get page data source for page ${pageId}:`, error);
        await logErrorToFirestore({
            message: `Failed to get page data source for page ${pageId}: ` + error.message,
            stack: error.stack,
        });
        return { success: false, error: 'Failed to fetch data source link.' };
    }
}
