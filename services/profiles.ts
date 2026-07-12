'use server';

import { prisma as db } from '@/core/database/prisma';
import { cookies } from 'next/headers';
import { normalizeUrl } from '@/core/lib/url-utils';

type ProfileEntryInput = {
  subject: string;
  value: string;
};

async function getAssetIdOrThrow(explicitAssetId?: string): Promise<string> {
  const cookieStore = await cookies();
  const assetId = explicitAssetId ?? cookieStore.get('assetId')?.value;
  if (!assetId) {
    throw new Error('Asset context not found.');
  }
  return assetId;
}

function coerceProfileValue(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.length > 512) {
    throw new Error('Profile value exceeds 512 characters.');
  }
  return trimmed;
}

function normalizeSocialPlatformKey(platformName: string): string {
  return platformName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

export async function getProfileEntries(explicitAssetId?: string): Promise<{
  success: boolean;
  entries?: { id: string; subject: string; value: string }[];
  error?: string;
}> {
  try {
    const assetId = await getAssetIdOrThrow(explicitAssetId);
    const entries = await db.profile.findMany({
      where: { assetId },
      select: { id: true, subject: true, value: true },
      orderBy: [{ subject: 'asc' }, { id: 'asc' }],
    });
    return { success: true, entries };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Failed to fetch profile entries.' };
  }
}

export async function replaceProfileSubjectValues(input: {
  assetId?: string;
  subject: string;
  values: string[];
}): Promise<{ success: boolean; error?: string }> {
  try {
    const assetId = await getAssetIdOrThrow(input.assetId);
    const subject = input.subject.trim();
    if (!subject) return { success: false, error: 'Subject is required.' };

    const values = input.values
      .map(coerceProfileValue)
      .filter(Boolean);

    await db.$transaction(async (tx) => {
      await tx.profile.deleteMany({ where: { assetId, subject } });
      if (values.length) {
        await tx.profile.createMany({
          data: values.map((value) => ({ assetId, subject, value })),
        });
      }
    });

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Failed to update profile values.' };
  }
}

export async function replaceProfilePrefixEntries(input: {
  assetId?: string;
  prefix: string;
  entries: ProfileEntryInput[];
}): Promise<{ success: boolean; error?: string }> {
  try {
    const assetId = await getAssetIdOrThrow(input.assetId);
    const prefix = input.prefix.trim();
    if (!prefix) return { success: false, error: 'Prefix is required.' };

    const normalizedEntries = input.entries
      .map((entry) => ({
        subject: entry.subject.trim(),
        value: coerceProfileValue(entry.value),
      }))
      .filter((entry) => entry.subject && entry.value);

    await db.$transaction(async (tx) => {
      await tx.profile.deleteMany({
        where: { assetId, subject: { startsWith: `${prefix}.` } },
      });
      if (normalizedEntries.length) {
        await tx.profile.createMany({
          data: normalizedEntries.map((entry) => ({
            assetId,
            subject: entry.subject,
            value: entry.value,
          })),
        });
      }
    });

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Failed to update profile entries.' };
  }
}

export async function syncAssetProfileSubjects(input: {
  assetId?: string;
  name?: string;
  logoUrl?: string | null;
  description?: string | null;
  hideLogo?: boolean;
  hideSitename?: boolean;
  contactEmail?: { value: string }[];
  contactPhone?: { value: string }[];
  socialProfiles?: { platformName: string; url: string }[];
}): Promise<{ success: boolean; error?: string }> {
  try {
    const assetId = await getAssetIdOrThrow(input.assetId);

    const ops: Promise<any>[] = [];

    if (typeof input.name === 'string') {
      ops.push(replaceProfileSubjectValues({ assetId, subject: 'brand.name', values: [input.name] }));
    }

    if (typeof input.logoUrl === 'string') {
      ops.push(
        replaceProfileSubjectValues({
          assetId,
          subject: 'brand.logo',
          values: [normalizeUrl(input.logoUrl)],
        })
      );
    }

    if (typeof input.description === 'string') {
      ops.push(replaceProfileSubjectValues({ assetId, subject: 'brand.description', values: [input.description] }));
    }

    if (typeof input.hideLogo === 'boolean') {
      ops.push(
        replaceProfileSubjectValues({
          assetId,
          subject: 'brand.logoVisibility',
          values: [String(!input.hideLogo)],
        })
      );
    }

    if (typeof input.hideSitename === 'boolean') {
      ops.push(
        replaceProfileSubjectValues({
          assetId,
          subject: 'brand.nameVisibility',
          values: [String(!input.hideSitename)],
        })
      );
    }

    if (input.contactEmail) {
      ops.push(
        replaceProfileSubjectValues({
          assetId,
          subject: 'contact.email',
          values: input.contactEmail.map((entry) => entry.value),
        })
      );
    }

    if (input.contactPhone) {
      ops.push(
        replaceProfileSubjectValues({
          assetId,
          subject: 'contact.phone',
          values: input.contactPhone.map((entry) => entry.value),
        })
      );
    }

    if (input.socialProfiles) {
      const entries: ProfileEntryInput[] = input.socialProfiles
        .map((profile) => {
          const key = normalizeSocialPlatformKey(profile.platformName);
          if (!key) return null;
          return {
            subject: `socialProfile.${key}`,
            value: normalizeUrl(profile.url),
          };
        })
        .filter(Boolean) as ProfileEntryInput[];

      ops.push(
        replaceProfilePrefixEntries({
          assetId,
          prefix: 'socialProfile',
          entries,
        })
      );
    }

    await Promise.all(ops);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Failed to sync profile subjects.' };
  }
}
