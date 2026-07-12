
'use server';

import { cookies } from 'next/headers';
import { Asset, AssetTheme, AssetIcons } from '@/services/asset/type';
import { generateThemeFromColor } from '@/core/helpers/color';
import { markAssetsAsPending, markThemeAsPending } from '@/services/structure';
import { revalidatePath } from 'next/cache';
import { prisma as db } from '@/core/database/prisma';
import { syncAssetProfileSubjects } from '@/services/profiles';

/*
::neup.documentation::asset-service

::public

Server-side asset configuration service.

Client callers such as the profile context must receive plain JSON-serializable
objects, so database JSON fields are normalized before being returned.

::public end
::end
*/

export async function getAsset(): Promise<{ success: boolean, asset?: Asset, error?: string }> {
  const cookieStore = await cookies();
  const assetId = cookieStore.get('assetId')?.value;
  if (!assetId) return { success: true, asset: undefined };

  try {
    const [record, themeRecord, profileEntries] = await Promise.all([
      db.asset.findUnique({ where: { id: assetId } }),
      db.theme.findUnique({ where: { id: assetId } }),
      db.profile.findMany({
        where: { assetId },
        select: { subject: true, value: true },
      }),
    ]);

    if (!record) return { success: true, asset: undefined };

    const subjectToValues = new Map<string, string[]>();
    const socialProfilesFromDb: { platformName: string; url: string }[] = [];

    profileEntries.forEach((entry) => {
      const values = subjectToValues.get(entry.subject) ?? [];
      values.push(entry.value);
      subjectToValues.set(entry.subject, values);

      if (entry.subject.startsWith('socialProfile.')) {
        const platformName = entry.subject.slice('socialProfile.'.length);
        if (platformName) socialProfilesFromDb.push({ platformName, url: entry.value });
      }
    });

    const contactEmailFromDb = subjectToValues.get('contact.email')?.map((value) => ({ value })) ?? [];
    const contactPhoneFromDb = subjectToValues.get('contact.phone')?.map((value) => ({ value })) ?? [];
    const logoUrlFromDb = subjectToValues.get('brand.logo')?.[0];
    const descriptionFromDb = subjectToValues.get('brand.description')?.[0];

    const data = record as any;
    const asset: Asset = {
      id: record.id,
      name: record.name,
      url: record.url ?? undefined,
      domains: data.domains,
      tier: (record.tier as Asset['tier']) ?? 'free',
      logoUrl: logoUrlFromDb ?? data.logoUrl,
      icons: data.icons || {},
      hideSitename: themeRecord?.hideSitename || false,
      hideLogo: themeRecord?.hideLogo || false,
      description: descriptionFromDb ?? data.description,
      socialProfiles: socialProfilesFromDb.length ? socialProfilesFromDb : (data.socialProfiles || []),
      contactEmail: contactEmailFromDb.length ? contactEmailFromDb : (data.contactEmail || []),
      contactPhone: contactPhoneFromDb.length ? contactPhoneFromDb : (data.contactPhone || []),
      modules: data.modules || {},
      theme: (themeRecord?.theme as unknown as AssetTheme) || {},
      createdAt: record.createdAt ? record.createdAt.toISOString() : null,
      updatedAt: record.updatedAt ? record.updatedAt.toISOString() : null,
    };

    const serializedAsset = JSON.parse(JSON.stringify(asset)) as Asset;

    return { success: true, asset: serializedAsset };
  } catch (error: any) {
    return { success: false, error: 'Failed to fetch asset configuration. An error has been logged.' };
  }
}

export async function saveAsset(data: Partial<Omit<Asset, 'id'>>) {
  const cookieStore = await cookies();
  const assetId = cookieStore.get('assetId')?.value;
  if (!assetId) return { success: false, error: 'Asset ID not found.' };

  try {
    const [existing, existingTheme] = await Promise.all([
      db.asset.findUnique({ where: { id: assetId } }),
      db.theme.findUnique({ where: { id: assetId } }),
    ]);

    const {
      hideSitename: nextHideSitename,
      hideLogo: nextHideLogo,
      theme: nextTheme,
      logoUrl,
      description,
      socialProfiles,
      contactEmail,
      contactPhone,
      ...assetDataPatch
    } = data;

    const assetData: Record<string, any> = { ...assetDataPatch, updatedAt: new Date() };

    if (!existing) assetData.createdAt = new Date();

    if (data.domains) {
      const existingDomains = (existing as any)?.domains || {};
      assetData.domains = {
        ...existingDomains,
        production: { ...existingDomains.production, ...data.domains.production },
        development: { ...existingDomains.development, ...data.domains.development },
      };
    }

    if (typeof logoUrl === 'string' && logoUrl.trim()) await markAssetsAsPending(assetId);

    if (data.icons) {
      assetData.icons = { ...((existing as any)?.icons || {}), ...data.icons };
      await markAssetsAsPending(assetId);
    }

    const hideSitenameChanged = typeof nextHideSitename === 'boolean' && nextHideSitename !== existingTheme?.hideSitename;
    const hideLogoChanged = typeof nextHideLogo === 'boolean' && nextHideLogo !== existingTheme?.hideLogo;

    if (data.name !== existing?.name || hideSitenameChanged || hideLogoChanged) await markAssetsAsPending(assetId);
    if (socialProfiles) await markAssetsAsPending(assetId);

    await db.asset.upsert({
      where: { id: assetId },
      create: { id: assetId, ...assetData },
      update: assetData,
    });

    const themeData: Record<string, any> = { updatedAt: new Date() };
    if (!existingTheme) themeData.createdAt = new Date();
    if (typeof nextHideSitename === 'boolean') themeData.hideSitename = nextHideSitename;
    if (typeof nextHideLogo === 'boolean') themeData.hideLogo = nextHideLogo;

    if (nextTheme) {
      themeData.theme = { ...nextTheme };
      if (nextTheme.colors && nextTheme.colors.length > 0) {
        themeData.theme.generated = generateThemeFromColor(nextTheme.colors);
      }
      await markThemeAsPending(assetId);
    }

    await db.theme.upsert({
      where: { id: assetId },
      create: { id: assetId, ...themeData },
      update: themeData,
    });

    const profileSync = await syncAssetProfileSubjects({
      assetId,
      name: typeof data.name === 'string' ? data.name : undefined,
      logoUrl: typeof logoUrl === 'string' ? logoUrl : undefined,
      description: typeof description === 'string' ? description : undefined,
      hideLogo: typeof nextHideLogo === 'boolean' ? nextHideLogo : undefined,
      hideSitename: typeof nextHideSitename === 'boolean' ? nextHideSitename : undefined,
      socialProfiles,
      contactEmail,
      contactPhone,
    });
    if (!profileSync.success) return { success: false, error: profileSync.error || 'Failed to sync profile subjects.' };

    revalidatePath('/', 'layout');
    return { success: true, id: assetId };
  } catch (error: any) {
    return { success: false, error: `Failed to save asset config for ${assetId}. An error has been logged.` };
  }
}
