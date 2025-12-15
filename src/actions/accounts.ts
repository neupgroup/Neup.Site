
'use server';

import { getFirestore, collection, query, where, getDocs, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/lib/firebase';
import { logErrorToFirestore } from '@/lib/logging';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export interface LinkedAccount {
    id: string;
    account_id: string;
    platform: 'github' | 'google';
    authorized_on: string | null;
    authorization_info: {
        access_token: string;
        refresh_token: string | null;
        scope: string;
        provider_user_id: string;
        provider_username: string;
    };
}

export async function getAccountId(): Promise<string> {
    const cookieStore = await cookies();
    let accountId = cookieStore.get('account_id')?.value;
    if (!accountId) {
        accountId = `user_${crypto.randomBytes(8).toString('hex')}`;
        cookieStore.set('account_id', accountId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 365, // One year
            path: '/',
        });
    }
    return accountId;
}

export async function getLinkedAccounts(): Promise<{ accounts?: LinkedAccount[], error?: string }> {
    const accountId = await getAccountId();
    if (!accountId) {
        // This case should ideally not happen if user is in the dashboard.
        // Returning an empty array is safer than throwing.
        return { accounts: [] };
    }
    try {
        const { firestore } = initializeFirebase();
        const q = query(collection(firestore, 'linked_accounts'), where('account_id', '==', accountId));
        const querySnapshot = await getDocs(q);
        const accounts = querySnapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                ...data,
                authorized_on: data.authorized_on instanceof Timestamp ? data.authorized_on.toDate().toISOString() : null,
            } as LinkedAccount
        });
        return { accounts };
    } catch (e: any) {
        await logErrorToFirestore({
            message: `Failed to get linked accounts for user ${accountId}: ${e.message}`,
            stack: e.stack,
            source: 'getLinkedAccounts',
        });
        return { error: 'Failed to retrieve linked accounts.' };
    }
}

export async function deleteLinkedAccount(id: string): Promise<{ success: boolean; error?: string }> {
    const accountId = await getAccountId();
    if (!accountId) {
        return { success: false, error: 'User not authenticated.' };
    }
    try {
        const { firestore } = initializeFirebase();
        const docRef = doc(firestore, 'linked_accounts', id);
        // Optional: You might want to verify ownership before deleting
        // const docSnap = await getDoc(docRef);
        // if (!docSnap.exists() || docSnap.data().account_id !== accountId) {
        //     return { success: false, error: 'Unauthorized or account not found.' };
        // }
        await deleteDoc(docRef);
        return { success: true };
    } catch (e: any) {
        await logErrorToFirestore({
            message: `Failed to delete linked account ${id} for user ${accountId}: ${e.message}`,
            stack: e.stack,
            source: 'deleteLinkedAccount',
        });
        return { success: false, error: 'Failed to disconnect account.' };
    }
}
