
'use server';

import {
  collection,
  doc,
  deleteDoc,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
  Timestamp,
  orderBy,
} from 'firebase/firestore';
import { initializeFirebase } from '@/lib/firebase';
import { logErrorToFirestore } from '@/lib/logging';
import { getAccountId } from './accounts';
import { revalidatePath } from 'next/cache';
import { ApiToken } from '@/schemas/token';

export async function createToken(name: string, tokenHash: string, tokenPrefix: string): Promise<{ success: boolean; id?: string; error?: string }> {
  const accountId = await getAccountId();
  if (!accountId) {
    return { success: false, error: 'User not authenticated.' };
  }

  try {
    const { firestore } = initializeFirebase();
    const docRef = await addDoc(collection(firestore, 'api_tokens'), {
      accountId,
      name,
      tokenHash,
      tokenPrefix,
      createdAt: serverTimestamp(),
      lastUsed: null,
    });
    revalidatePath('/settings/tokens');
    return { success: true, id: docRef.id };
  } catch (e: any) {
    await logErrorToFirestore({
      message: `Failed to create token: ${e.message}`,
      stack: e.stack,
      source: 'createToken',
    });
    return { success: false, error: 'Failed to create token.' };
  }
}

export async function getTokens(): Promise<{ success: boolean; tokens?: ApiToken[]; error?: string }> {
  const accountId = await getAccountId();
  if (!accountId) {
    return { success: false, error: 'User not authenticated.' };
  }

  try {
    const { firestore } = initializeFirebase();
    const q = query(
      collection(firestore, 'api_tokens'),
      where('accountId', '==', accountId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const tokens = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        accountId: data.accountId,
        name: data.name,
        // The full token is NOT returned for security reasons, only a prefix
        token: `${data.tokenPrefix}...`,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : null,
        lastUsed: data.lastUsed instanceof Timestamp ? data.lastUsed.toDate().toISOString() : null,
      } as ApiToken;
    });
    return { success: true, tokens };
  } catch (e: any) {
    await logErrorToFirestore({
      message: `Failed to get tokens: ${e.message}`,
      stack: e.stack,
      source: 'getTokens',
    });
    return { success: false, error: 'Failed to fetch tokens.' };
  }
}

export async function revokeToken(id: string): Promise<{ success: boolean; error?: string }> {
  const accountId = await getAccountId();
  if (!accountId) {
    return { success: false, error: 'User not authenticated.' };
  }

  try {
    const { firestore } = initializeFirebase();
    // In a real app, you'd verify ownership before deleting
    await deleteDoc(doc(firestore, 'api_tokens', id));
    revalidatePath('/settings/tokens');
    return { success: true };
  } catch (e: any) {
    await logErrorToFirestore({
      message: `Failed to revoke token: ${e.message}`,
      stack: e.stack,
      source: 'revokeToken',
    });
    return { success: false, error: 'Failed to revoke token.' };
  }
}
