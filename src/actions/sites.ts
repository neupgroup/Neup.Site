
'use server';

import { db } from '@/lib/db';
import { toIsoString } from '@/lib/db-utils';
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
    const records = await db.site.findMany({
      where: { ownerAccountId: accountId },
    });

    const sites = records.map((record) => ({
      id: record.id,
      name: record.name || '',
      url: record.url || '',
      domainSettings: undefined,
      domains: record.domains ?? undefined,
      tier: (record.tier as Site['tier']) || 'free',
      logoUrl: record.logoUrl ?? undefined,
      icons: (record.icons as Site['icons']) ?? {},
      hideSitename: record.hideSitename ?? false,
      hideLogo: record.hideLogo ?? false,
      description: record.description ?? undefined,
      socialProfiles: (record.socialProfiles as Site['socialProfiles']) ?? [],
      contactEmail: (record.contactEmail as Site['contactEmail']) ?? [],
      contactPhone: (record.contactPhone as Site['contactPhone']) ?? [],
      modules: (record.modules as Site['modules']) ?? {},
      theme: (record.theme as Site['theme']) ?? undefined,
      ownerAccountId: record.ownerAccountId ?? undefined,
      status: record.status ?? undefined,
      type: record.type ?? undefined,
      createdAt: toIsoString(record.createdAt),
      updatedAt: toIsoString(record.updatedAt),
    })) as Site[];

    return { sites };
  } catch (e: any) {
    return { error: 'Failed to retrieve sites.' };
  }
}
