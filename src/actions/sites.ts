
'use server';

import { collection, query, where, getDocs, Timestamp } from '@/lib/firestore';
import { getDataStore } from '@/lib/data-store';
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
    const { firestore } = getDataStore();
    const q = query(collection(firestore, 'sites'), where('ownerAccountId', '==', accountId));
    const sitesSnapshot = await getDocs(q);
    const sites = sitesSnapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      const createdAt = data.createdAt;
      const updatedAt = data.updatedAt;

      return {
        id: docSnap.id,
        name: data.name || '',
        url: data.url || '',
        domainSettings: data.domainSettings,
        domains: data.domains,
        tier: data.tier || 'free',
        logoUrl: data.logoUrl,
        icons: data.icons || {},
        hideSitename: data.hideSitename || false,
        hideLogo: data.hideLogo || false,
        description: data.description,
        socialProfiles: data.socialProfiles || [],
        contactEmail: data.contactEmail || [],
        contactPhone: data.contactPhone || [],
        modules: data.modules || {},
        theme: data.theme,
        ownerAccountId: data.ownerAccountId,
        status: data.status,
        type: data.type,
        createdAt: createdAt instanceof Timestamp ? createdAt.toDate().toISOString() : null,
        updatedAt: updatedAt instanceof Timestamp ? updatedAt.toDate().toISOString() : null,
      } as Site;
    });

    return { sites };
  } catch (e: any) {
    return { error: 'Failed to retrieve sites.' };
  }
}
