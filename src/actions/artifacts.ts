'use server';

import crypto from 'crypto';
import { db } from '@/lib/db';
import { getAccountId } from './accounts';

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
      include: { artifact: true },
    });

    const artifactsById = new Map<string, ArtifactSummary>();

    roles.forEach((role) => {
      if (!role.artifact) return;
      if (!artifactsById.has(role.artifact.id)) {
        artifactsById.set(role.artifact.id, {
          id: role.artifact.id,
          name: role.artifact.name,
          logoUrl: role.artifact.logoUrl ?? null,
          description: role.artifact.description,
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
    logoUrl: input.logoUrl?.trim() || null,
    description: input.description?.trim() || null,
  };

  try {
    await db.$transaction([
      db.account.upsert({
        where: { id: accountId },
        create: { id: accountId },
        update: {},
      }),
      db.artifact.create({ data: artifactData }),
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

    return { success: true, artifact: artifactData };
  } catch (error: any) {
    return { success: false, error: 'Failed to create artifact.' };
  }
}
