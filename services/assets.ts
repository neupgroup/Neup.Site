'use server';

import crypto from 'crypto';
import { prisma as db } from '@/core/database/prisma';
import { getAccountId } from './accounts';
import { normalizeUrl } from '@/core/helpers/link/url';
import { createDefaultAssetTheme } from '@/services/themes';
import { resolveAssetLogoUrl } from '@/core/helpers/asset/logo';

export interface AssetSummary {
  id: string;
  name: string;
  logoUrl: string | null;
  description: string | null;
}

export async function getAssetsForAccount(): Promise<{ assets?: AssetSummary[]; error?: string }> {
  const accountId = await getAccountId();
  if (!accountId) {
    return { error: 'User account not found.' };
  }

  try {
    const roles = await db.role.findMany({
      where: { accountId },
      include: {
        asset: {
          include: {
            profiles: {
              where: { subject: { in: ['brand.logo', 'brand.description'] } },
              select: { subject: true, value: true },
            },
          },
        },
      },
    });

    const assetsById = new Map<string, AssetSummary>();

    roles.forEach((role) => {
      if (!role.asset) return;
      if (!assetsById.has(role.asset.id)) {
        const logoUrl = role.asset.profiles.find((entry) => entry.subject === 'brand.logo')?.value ?? null;
        const description =
          role.asset.profiles.find((entry) => entry.subject === 'brand.description')?.value ?? null;

        assetsById.set(role.asset.id, {
          id: role.asset.id,
          name: role.asset.name,
          logoUrl: resolveAssetLogoUrl(logoUrl),
          description,
        });
      }
    });

    return { assets: Array.from(assetsById.values()) };
  } catch (error: any) {
    return { error: 'Failed to retrieve assets.' };
  }
}

export async function createAssetForAccount(input: {
  name: string;
  logoUrl?: string | null;
  description?: string | null;
}): Promise<{ success: boolean; asset?: AssetSummary; error?: string }> {
  const accountId = await getAccountId();
  if (!accountId) {
    return { success: false, error: 'User account not found.' };
  }

  const name = input.name.trim();
  if (!name) {
    return { success: false, error: 'Asset name is required.' };
  }

  const assetId = crypto.randomUUID();
  const roleId = crypto.randomUUID();

  const assetData = {
    id: assetId,
    name,
  };
  const now = new Date();
  const defaultTheme = createDefaultAssetTheme();

  try {
    await db.$transaction([
      db.account.upsert({
        where: { id: accountId },
        create: { id: accountId },
        update: {},
      }),
      db.asset.create({ data: assetData }),
      db.theme.create({
        data: {
          id: assetId,
          theme: defaultTheme as any,
          createdAt: now,
          updatedAt: now,
        },
      }),
      db.profile.createMany({
        data: [
          ...(input.logoUrl?.trim()
            ? [{ assetId, subject: 'brand.logo', value: normalizeUrl(input.logoUrl.trim()).slice(0, 512) }]
            : []),
          ...(input.description?.trim()
            ? [{ assetId, subject: 'brand.description', value: input.description.trim().slice(0, 512) }]
            : []),
        ],
      }),
      db.role.create({
        data: {
          id: roleId,
          assetId,
          portfolioId: assetId,
          accountId,
          role: 'owner',
        },
      }),
    ]);

    return {
      success: true,
      asset: {
        ...assetData,
        logoUrl: resolveAssetLogoUrl(input.logoUrl),
        description: input.description?.trim() || null,
      },
    };
  } catch (error: any) {
    return { success: false, error: 'Failed to create asset.' };
  }
}
