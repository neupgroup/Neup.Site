
'use server';

import { cookies } from 'next/headers';
import { Artifact, ArtifactTheme, ArtifactIcons } from '@/schemas/artifact';
import { generateThemeFromColor } from '@/core/lib/color-utils';
import { markAssetsAsPending, markThemeAsPending } from '@/services/structure';
import { revalidatePath } from 'next/cache';
import { db } from '@/core/lib/db';
import { syncArtifactProfileSubjects } from '@/services/profiles';

export async function getArtifact(): Promise<{ success: boolean, artifact?: Artifact, error?: string }> {
  const cookieStore = await cookies();
  const artifactId = cookieStore.get('artifactId')?.value;
  if (!artifactId) return { success: true, artifact: undefined };

  try {
    const [record, themeRecord, profileEntries] = await Promise.all([
      db.artifact.findUnique({ where: { id: artifactId } }),
      db.theme.findUnique({ where: { id: artifactId } }),
      db.profile.findMany({
        where: { artifactId },
        select: { subject: true, value: true },
      }),
    ]);

    if (!record) return { success: true, artifact: undefined };

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
    const artifact: Artifact = {
      id: record.id,
      name: record.name,
      url: record.url ?? undefined,
      domains: data.domains,
      tier: (record.tier as Artifact['tier']) ?? 'free',
      logoUrl: logoUrlFromDb ?? data.logoUrl,
      icons: data.icons || {},
      hideSitename: themeRecord?.hideSitename || false,
      hideLogo: themeRecord?.hideLogo || false,
      description: descriptionFromDb ?? data.description,
      socialProfiles: socialProfilesFromDb.length ? socialProfilesFromDb : (data.socialProfiles || []),
      contactEmail: contactEmailFromDb.length ? contactEmailFromDb : (data.contactEmail || []),
      contactPhone: contactPhoneFromDb.length ? contactPhoneFromDb : (data.contactPhone || []),
      modules: data.modules || {},
      theme: (themeRecord?.theme as ArtifactTheme) || {},
      createdAt: record.createdAt ? record.createdAt.toISOString() : null,
      updatedAt: record.updatedAt ? record.updatedAt.toISOString() : null,
    };

    return { success: true, artifact };
  } catch (error: any) {
    return { success: false, error: 'Failed to fetch artifact configuration. An error has been logged.' };
  }
}

export async function saveArtifact(data: Partial<Omit<Artifact, 'id'>>) {
  const cookieStore = await cookies();
  const artifactId = cookieStore.get('artifactId')?.value;
  if (!artifactId) return { success: false, error: 'Artifact ID not found.' };

  try {
    const [existing, existingTheme] = await Promise.all([
      db.artifact.findUnique({ where: { id: artifactId } }),
      db.theme.findUnique({ where: { id: artifactId } }),
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
      ...artifactDataPatch
    } = data;

    const artifactData: Record<string, any> = { ...artifactDataPatch, updatedAt: new Date() };

    if (!existing) artifactData.createdAt = new Date();

    if (data.domains) {
      const existingDomains = (existing as any)?.domains || {};
      artifactData.domains = {
        ...existingDomains,
        production: { ...existingDomains.production, ...data.domains.production },
        development: { ...existingDomains.development, ...data.domains.development },
      };
    }

    if (typeof logoUrl === 'string' && logoUrl.trim()) await markAssetsAsPending(artifactId);

    if (data.icons) {
      artifactData.icons = { ...((existing as any)?.icons || {}), ...data.icons };
      await markAssetsAsPending(artifactId);
    }

    const hideSitenameChanged = typeof nextHideSitename === 'boolean' && nextHideSitename !== existingTheme?.hideSitename;
    const hideLogoChanged = typeof nextHideLogo === 'boolean' && nextHideLogo !== existingTheme?.hideLogo;

    if (data.name !== existing?.name || hideSitenameChanged || hideLogoChanged) await markAssetsAsPending(artifactId);
    if (socialProfiles) await markAssetsAsPending(artifactId);

    await db.artifact.upsert({
      where: { id: artifactId },
      create: { id: artifactId, ...artifactData },
      update: artifactData,
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
      await markThemeAsPending(artifactId);
    }

    await db.theme.upsert({
      where: { id: artifactId },
      create: { id: artifactId, ...themeData },
      update: themeData,
    });

    const profileSync = await syncArtifactProfileSubjects({
      artifactId,
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
    return { success: true, id: artifactId };
  } catch (error: any) {
    return { success: false, error: `Failed to save artifact config for ${artifactId}. An error has been logged.` };
  }
}
