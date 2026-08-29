'use server';

import { getActiveProjectId } from '@/services/projects';

import { prisma as db } from '#/core/database/prisma';
import { getAccountId } from '@/services/accounts';

/*
::neup.documentation::access-service

::public

Service functions for showing which accounts can access which sites.

The overview is scoped to sites the current signed-in account manages, then
groups access by both user and site for management dashboards.

::public end
::end
*/

export interface AccessOverviewUserSite {
  assetId: string;
  assetName: string;
  roles: string[];
  isCurrentAsset: boolean;
}

export interface AccessOverviewUser {
  accountId: string;
  totalSites: number;
  sites: AccessOverviewUserSite[];
}

export interface AccessOverviewSiteUser {
  accountId: string;
  roles: string[];
}

export interface AccessOverviewSite {
  assetId: string;
  assetName: string;
  totalUsers: number;
  users: AccessOverviewSiteUser[];
  isCurrentAsset: boolean;
}

function normalizeRole(value: string) {
  return value.trim().toLowerCase();
}

function formatAssetName(name: string, assetId: string) {
  const trimmedName = name.trim();
  return trimmedName || `Untitled Site (${assetId.slice(0, 8)})`;
}

export async function getAccessOverview(): Promise<{
  success: boolean;
  users?: AccessOverviewUser[];
  sites?: AccessOverviewSite[];
  error?: string;
}> {
  try {
    const accountId = await getAccountId();
    const currentAssetId = await getActiveProjectId() ?? null;

    const managedAssets = await db.asset.findMany({
      where: {
        OR: [
          { ownerAccountId: accountId },
          {
            roles: {
              some: {
                accountId,
                role: 'owner',
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        ownerAccountId: true,
        roles: {
          select: {
            accountId: true,
            role: true,
          },
        },
      },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    });

    const userMap = new Map<string, Map<string, { assetName: string; roles: Set<string>; isCurrentAsset: boolean }>>();
    const siteMap = new Map<string, { assetName: string; isCurrentAsset: boolean; users: Map<string, Set<string>> }>();

    for (const asset of managedAssets) {
      const assetName = formatAssetName(asset.name, asset.id);
      const isCurrentAsset = asset.id === currentAssetId;
      const accessRows = asset.roles.map((role) => ({
        accountId: role.accountId,
        role: normalizeRole(role.role),
      }));

      if (asset.ownerAccountId?.trim()) {
        const ownerId = asset.ownerAccountId.trim();
        const ownerAlreadyPresent = accessRows.some((row) => row.accountId === ownerId && row.role === 'owner');
        if (!ownerAlreadyPresent) {
          accessRows.push({ accountId: ownerId, role: 'owner' });
        }
      }

      for (const accessRow of accessRows) {
        if (!accessRow.accountId) continue;

        const userAssets = userMap.get(accessRow.accountId) ?? new Map<string, { assetName: string; roles: Set<string>; isCurrentAsset: boolean }>();
        const userAssetEntry = userAssets.get(asset.id) ?? {
          assetName,
          roles: new Set<string>(),
          isCurrentAsset,
        };
        userAssetEntry.roles.add(accessRow.role);
        userAssets.set(asset.id, userAssetEntry);
        userMap.set(accessRow.accountId, userAssets);

        const siteEntry = siteMap.get(asset.id) ?? {
          assetName,
          isCurrentAsset,
          users: new Map<string, Set<string>>(),
        };
        const userRoles = siteEntry.users.get(accessRow.accountId) ?? new Set<string>();
        userRoles.add(accessRow.role);
        siteEntry.users.set(accessRow.accountId, userRoles);
        siteMap.set(asset.id, siteEntry);
      }
    }

    const users: AccessOverviewUser[] = Array.from(userMap.entries())
      .map(([userAccountId, assets]) => ({
        accountId: userAccountId,
        totalSites: assets.size,
        sites: Array.from(assets.entries())
          .map(([assetId, asset]) => ({
            assetId,
            assetName: asset.assetName,
            roles: Array.from(asset.roles).sort(),
            isCurrentAsset: asset.isCurrentAsset,
          }))
          .sort((left, right) => left.assetName.localeCompare(right.assetName) || left.assetId.localeCompare(right.assetId)),
      }))
      .sort((left, right) => left.accountId.localeCompare(right.accountId));

    const sites: AccessOverviewSite[] = Array.from(siteMap.entries())
      .map(([assetId, site]) => ({
        assetId,
        assetName: site.assetName,
        totalUsers: site.users.size,
        isCurrentAsset: site.isCurrentAsset,
        users: Array.from(site.users.entries())
          .map(([userAccountId, roles]) => ({
            accountId: userAccountId,
            roles: Array.from(roles).sort(),
          }))
          .sort((left, right) => left.accountId.localeCompare(right.accountId)),
      }))
      .sort((left, right) => left.assetName.localeCompare(right.assetName) || left.assetId.localeCompare(right.assetId));

    return {
      success: true,
      users,
      sites,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to load access overview.',
    };
  }
}
