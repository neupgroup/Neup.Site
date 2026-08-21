
'use server';

import { prisma as db } from '@/core/database/prisma';
import { getAccountId } from './accounts';
import type { Asset } from '@/services/asset/type';
import { resolveAssetLogoUrl } from '@/core/helpers/asset/logo';

/**
 * Fetches all assets owned by the current account ID.
 * Kept as a backwards-compatible helper (historically named "sites").
 */
export async function getSitesForAccount(): Promise<{ sites?: Asset[]; error?: string }> {
  const accountId = await getAccountId();
  if (!accountId) {
    return { error: 'User account not found.' };
  }

  try {
    const records = await db.asset.findMany({
      where: { ownerAccountId: accountId },
      include: {
        themeEntry: true,
        profiles: { select: { subject: true, value: true } },
      },
    });

    const sites = records.map((record) => {
      const subjectToValues = new Map<string, string[]>();
      const socialProfiles: { platformName: string; url: string }[] = [];

      record.profiles.forEach((entry) => {
        const values = subjectToValues.get(entry.subject) ?? [];
        values.push(entry.value);
        subjectToValues.set(entry.subject, values);

        if (entry.subject.startsWith('socialProfile.')) {
          const platformName = entry.subject.slice('socialProfile.'.length);
          if (platformName) {
            socialProfiles.push({ platformName, url: entry.value });
          }
        }
      });

      const logoUrl = subjectToValues.get('brand.logo')?.[0];
      const description = subjectToValues.get('brand.description')?.[0];
      const contactEmail = subjectToValues.get('contact.email')?.map((value) => ({ value })) ?? [];
      const contactPhone = subjectToValues.get('contact.phone')?.map((value) => ({ value })) ?? [];

      return {
        id: record.id,
        name: record.name || '',
        url: record.url || '',
        domainSettings: undefined,
        domains: record.domains ?? undefined,
        tier: (record.tier as Asset['tier']) || 'free',
        logoUrl: resolveAssetLogoUrl(logoUrl),
        icons: (record.icons as Asset['icons']) ?? {},
        hideSitename: record.themeEntry?.hideSitename ?? false,
        hideLogo: record.themeEntry?.hideLogo ?? false,
        description: description ?? undefined,
        socialProfiles,
        contactEmail,
        contactPhone,
        modules: (record.modules as Asset['modules']) ?? {},
        theme: (record.themeEntry?.theme as Asset['theme']) ?? undefined,
        ownerAccountId: record.ownerAccountId ?? undefined,
        status: record.status ?? undefined,
        type: record.type ?? undefined,
      };
    }) as Asset[];

    return { sites };
  } catch (e: any) {
    return { error: 'Failed to retrieve sites.' };
  }
}
