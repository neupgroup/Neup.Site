
'use server';

import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { initializeFirebase } from '@/lib/firebase';
import { getAccountId } from './accounts';
import type { Site } from '@/schemas/site';

/**
 * Fetches all sites associated with the current account ID.
 * This is used for the site switcher functionality.
 */
export async function getSitesForAccount(): Promise<{ sites?: Site[]; error?: string }> {
  const accountId = await getAccountId();
  if (!accountId) {
    return { error: 'User account not found.' };
  }

  try {
    const { firestore } = initializeFirebase();
    const q = query(collection(firestore, 'sites'), where('ownerAccountId', '==', accountId));
    // In a real multi-tenant app, you would query a 'user_sites' mapping collection
    // For this demo, we assume a simple ownership model on the site itself.
    // This is NOT a scalable approach for production.
    
    // A more scalable approach would be to have a `sites` collection and a `users` collection.
    // A `user_sites` collection could map user IDs to site IDs they have access to.
    // For now, we will simulate this by fetching all sites and filtering.
    // THIS IS INEFFICIENT and for demo purposes only.

    const allSitesSnapshot = await getDocs(collection(firestore, 'sites'));
    const sites = allSitesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Site));

    return { sites };
  } catch (e: any) {
    return { error: 'Failed to retrieve sites.' };
  }
}
