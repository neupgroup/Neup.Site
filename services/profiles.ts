'use server';

import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { normalizeUrl } from '@/lib/url-utils';

type ProfileEntryInput = {
  subject: string;
  value: string;
};

async function getArtifactIdOrThrow(explicitArtifactId?: string): Promise<string> {
  const cookieStore = await cookies();
  const artifactId = explicitArtifactId ?? cookieStore.get('artifactId')?.value;
  if (!artifactId) {
    throw new Error('Artifact context not found.');
  }
  return artifactId;
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

export async function getProfileEntries(explicitArtifactId?: string): Promise<{
  success: boolean;
  entries?: { id: string; subject: string; value: string }[];
  error?: string;
}> {
  try {
    const artifactId = await getArtifactIdOrThrow(explicitArtifactId);
    const entries = await db.profile.findMany({
      where: { artifactId },
      select: { id: true, subject: true, value: true },
      orderBy: [{ subject: 'asc' }, { id: 'asc' }],
    });
    return { success: true, entries };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Failed to fetch profile entries.' };
  }
}

export async function replaceProfileSubjectValues(input: {
  artifactId?: string;
  subject: string;
  values: string[];
}): Promise<{ success: boolean; error?: string }> {
  try {
    const artifactId = await getArtifactIdOrThrow(input.artifactId);
    const subject = input.subject.trim();
    if (!subject) return { success: false, error: 'Subject is required.' };

    const values = input.values
      .map(coerceProfileValue)
      .filter(Boolean);

    await db.$transaction(async (tx) => {
      await tx.profile.deleteMany({ where: { artifactId, subject } });
      if (values.length) {
        await tx.profile.createMany({
          data: values.map((value) => ({ artifactId, subject, value })),
        });
      }
    });

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Failed to update profile values.' };
  }
}

export async function replaceProfilePrefixEntries(input: {
  artifactId?: string;
  prefix: string;
  entries: ProfileEntryInput[];
}): Promise<{ success: boolean; error?: string }> {
  try {
    const artifactId = await getArtifactIdOrThrow(input.artifactId);
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
        where: { artifactId, subject: { startsWith: `${prefix}.` } },
      });
      if (normalizedEntries.length) {
        await tx.profile.createMany({
          data: normalizedEntries.map((entry) => ({
            artifactId,
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

export async function syncArtifactProfileSubjects(input: {
  artifactId?: string;
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
    const artifactId = await getArtifactIdOrThrow(input.artifactId);

    const ops: Promise<any>[] = [];

    if (typeof input.name === 'string') {
      ops.push(replaceProfileSubjectValues({ artifactId, subject: 'brand.name', values: [input.name] }));
    }

    if (typeof input.logoUrl === 'string') {
      ops.push(
        replaceProfileSubjectValues({
          artifactId,
          subject: 'brand.logo',
          values: [normalizeUrl(input.logoUrl)],
        })
      );
    }

    if (typeof input.description === 'string') {
      ops.push(replaceProfileSubjectValues({ artifactId, subject: 'brand.description', values: [input.description] }));
    }

    if (typeof input.hideLogo === 'boolean') {
      ops.push(
        replaceProfileSubjectValues({
          artifactId,
          subject: 'brand.logoVisibility',
          values: [String(!input.hideLogo)],
        })
      );
    }

    if (typeof input.hideSitename === 'boolean') {
      ops.push(
        replaceProfileSubjectValues({
          artifactId,
          subject: 'brand.nameVisibility',
          values: [String(!input.hideSitename)],
        })
      );
    }

    if (input.contactEmail) {
      ops.push(
        replaceProfileSubjectValues({
          artifactId,
          subject: 'contact.email',
          values: input.contactEmail.map((entry) => entry.value),
        })
      );
    }

    if (input.contactPhone) {
      ops.push(
        replaceProfileSubjectValues({
          artifactId,
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
          artifactId,
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
