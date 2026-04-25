'use server';

import crypto from 'crypto';
import { db } from '@/core/lib/db';
import { getAccountId } from './accounts';
import { normalizeUrl } from '@/core/lib/url-utils';

export interface ArtifactSummary {
  id: string;
  name: string;
  logoUrl: string | null;
  description: string | null;
}

export async function getArtifactsForAccount(): Promise<{ artifacts?: ArtifactSummary[]; error?: string }> {
  const accountId = await getAccountId();
  if (!accountId) {
    return { error: 'User account not found.' };
  }

  try {
    const roles = await db.role.findMany({
      where: { accountId },
      include: {
        artifact: {
          include: {
            profiles: {
              where: { subject: { in: ['brand.logo', 'brand.description'] } },
              select: { subject: true, value: true },
            },
          },
        },
      },
    });

    const artifactsById = new Map<string, ArtifactSummary>();

    roles.forEach((role) => {
      if (!role.artifact) return;
      if (!artifactsById.has(role.artifact.id)) {
        const logoUrl = role.artifact.profiles.find((entry) => entry.subject === 'brand.logo')?.value ?? null;
        const description =
          role.artifact.profiles.find((entry) => entry.subject === 'brand.description')?.value ?? null;

        artifactsById.set(role.artifact.id, {
          id: role.artifact.id,
          name: role.artifact.name,
          logoUrl,
          description,
        });
      }
    });

    return { artifacts: Array.from(artifactsById.values()) };
  } catch (error: any) {
    return { error: 'Failed to retrieve artifacts.' };
  }
}

export async function createArtifactForAccount(input: {
  name: string;
  logoUrl?: string | null;
  description?: string | null;
}): Promise<{ success: boolean; artifact?: ArtifactSummary; error?: string }> {
  const accountId = await getAccountId();
  if (!accountId) {
    return { success: false, error: 'User account not found.' };
  }

  const name = input.name.trim();
  if (!name) {
    return { success: false, error: 'Artifact name is required.' };
  }

  const artifactId = crypto.randomUUID();
  const roleId = crypto.randomUUID();

  const artifactData = {
    id: artifactId,
    name,
  };

  try {
    await db.$transaction([
      db.account.upsert({
        where: { id: accountId },
        create: { id: accountId },
        update: {},
      }),
      db.artifact.create({ data: artifactData }),
      db.profile.createMany({
        data: [
          ...(input.logoUrl?.trim()
            ? [{ artifactId, subject: 'brand.logo', value: normalizeUrl(input.logoUrl.trim()).slice(0, 512) }]
            : []),
          ...(input.description?.trim()
            ? [{ artifactId, subject: 'brand.description', value: input.description.trim().slice(0, 512) }]
            : []),
        ],
      }),
      db.role.create({
        data: {
          id: roleId,
          artifactId,
          portfolioId: artifactId,
          accountId,
          role: 'owner',
        },
      }),
    ]);

    return {
      success: true,
      artifact: {
        ...artifactData,
        logoUrl: input.logoUrl?.trim() || null,
        description: input.description?.trim() || null,
      },
    };
  } catch (error: any) {
    return { success: false, error: 'Failed to create artifact.' };
  }
}
