'use server';

import crypto from 'crypto';
import { prisma as db } from '#/core/database/prisma';
import { logger } from '#/logica/logger';
import { getAccountId } from './accounts';
import { normalizeUrl } from '#/core/helpers/link/url';
import { createDefaultAssetTheme } from '@/services/themes';
import { resolveAssetLogoUrl } from '@/inapp/helpers/asset/logo';
import { ensureRecord } from '#/logica/account/self';

export interface AssetSummary {
  id: string;
  name: string;
  logoUrl: string | null;
  description: string | null;
}

export async function getAssetsForAccount(authToken?: string | null): Promise<{ assets?: AssetSummary[]; error?: string }> {
  const accountId = await getAccountId(authToken);
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
        const theme = ((role.asset.design as any)?.theme || createDefaultAssetTheme()) as any;

        assetsById.set(role.asset.id, {
          id: role.asset.id,
          name: role.asset.name,
          logoUrl: resolveAssetLogoUrl(logoUrl, theme),
          description,
        });
      }
    });

    return { assets: Array.from(assetsById.values()) };
  } catch (error: any) {
    const errorDetails = {
      message: error?.message || 'Unknown error',
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack,
      accountId,
    };

    if (process.env.NODE_ENV === 'development') {
      console.error('getAssetsForAccount failed:', errorDetails);
    } else {
      await logger.error({
        message: errorDetails.message,
        stack: errorDetails.stack,
        source: 'getAssetsForAccount',
        details: JSON.stringify(errorDetails),
      });
    }

    return { error: 'Failed to retrieve assets.' };
  }
}

export async function createAssetForAccount(input: {
  name: string;
  logoUrl?: string | null;
  description?: string | null;
}): Promise<{ success: boolean; asset?: AssetSummary; error?: string }> {
  try {
    await getAccountId();
  } catch {
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
    const account = await ensureRecord();
    if (!account?.id) {
      return { success: false, error: 'Authenticated account not found.' };
    }

    await db.$transaction([
      db.asset.create({ data: assetData }),
      db.asset.update({ where: { id: assetId }, data: { design: { theme: defaultTheme } as any } }),
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
          accountId: account.id,
          role: 'owner',
        },
      }),
    ]);

    return {
      success: true,
      asset: {
        ...assetData,
        logoUrl: resolveAssetLogoUrl(input.logoUrl, defaultTheme),
        description: input.description?.trim() || null,
      },
    };
  } catch (error: any) {
    return { success: false, error: 'Failed to create asset.' };
  }
}
