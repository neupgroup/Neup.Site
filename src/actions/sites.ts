
'use server';

import { db } from '@/lib/db';
import { getAccountId } from './accounts';
import type { Artifact } from '@/schemas/artifact';

/**
 * Fetches all artifacts owned by the current account ID.
 * Kept as a backwards-compatible helper (historically named "sites").
 */
export async function getSitesForAccount(): Promise<{ sites?: Artifact[]; error?: string }> {
  const accountId = await getAccountId();
  if (!accountId) {
    return { error: 'User account not found.' };
  }

  try {
    const records = await db.artifact.findMany({
      where: { ownerAccountId: accountId },
    });

    const sites = records.map((record) => ({
      id: record.id,
      name: record.name || '',
      url: record.url || '',
      domainSettings: undefined,
      domains: record.domains ?? undefined,
      tier: (record.tier as Artifact['tier']) || 'free',
      logoUrl: record.logoUrl ?? undefined,
      icons: (record.icons as Artifact['icons']) ?? {},
      hideSitename: record.hideSitename ?? false,
      hideLogo: record.hideLogo ?? false,
      description: record.description ?? undefined,
      socialProfiles: (record.socialProfiles as Artifact['socialProfiles']) ?? [],
      contactEmail: (record.contactEmail as Artifact['contactEmail']) ?? [],
      contactPhone: (record.contactPhone as Artifact['contactPhone']) ?? [],
      modules: (record.modules as Artifact['modules']) ?? {},
      theme: (record.theme as Artifact['theme']) ?? undefined,
      ownerAccountId: record.ownerAccountId ?? undefined,
      status: record.status ?? undefined,
      type: record.type ?? undefined,
    })) as Artifact[];

    return { sites };
  } catch (e: any) {
    return { error: 'Failed to retrieve sites.' };
  }
}
