'use server';

import { revalidatePath } from 'next/cache';
import { getActiveProjectId } from '@/services/projects';

import { prisma as db } from '@neup/core/database/prisma';
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
  displayName: string;
  neupId: string | null;
  totalSites: number;
  sites: AccessOverviewUserSite[];
}

export interface AccessOverviewSiteUser {
  accountId: string;
  displayName: string;
  neupId: string | null;
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

export interface AccessAddProject {
  id: string;
  name: string;
}

export interface AccessAddAccount {
  id: string;
  neupId: string | null;
  displayName: string;
}

export async function getAccessAddProjects(projectId?: string): Promise<{
  success: boolean;
  projects?: AccessAddProject[];
  accounts?: AccessAddAccount[];
  error?: string;
}> {
  try {
    const accountId = await getAccountId();
    const [projects, accounts] = await Promise.all([
      db.project.findMany({
        where: {
          ...(projectId ? { id: projectId } : {}),
          OR: [
            { ownerAccountId: accountId },
            { roles: { some: { accountId, role: 'owner' } } },
          ],
        },
        select: { id: true, name: true },
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
      }),
      db.account.findMany({
        select: { id: true, neupId: true, displayName: true },
        orderBy: [{ neupId: 'asc' }, { id: 'asc' }],
      }),
    ]);

    return {
      success: true,
      projects: projects.map((project) => ({ id: project.id, name: formatAssetName(project.name, project.id) })),
      accounts,
    };
  } catch {
    return { success: false, error: 'Failed to load managed sites.' };
  }
}

export async function addAccessRole(input: {
  accountId: string;
  assetId: string;
  role: string;
  expectedAssetId?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const managerAccountId = await getAccountId();
    const accountId = input.accountId.trim();
    const assetId = input.assetId.trim();
    const role = normalizeRole(input.role);
    const expectedAssetId = input.expectedAssetId?.trim();

    if (!accountId || !assetId || !role) return { success: false, error: 'Account, site, and role are required.' };
    if (expectedAssetId && assetId !== expectedAssetId) return { success: false, error: 'This access form is locked to a different site.' };
    if (role === 'owner') return { success: false, error: 'Owner access cannot be added here.' };

    const managedAsset = await db.project.findFirst({
      where: {
        id: assetId,
        OR: [
          { ownerAccountId: managerAccountId },
          { roles: { some: { accountId: managerAccountId, role: 'owner' } } },
        ],
      },
      select: { id: true },
    });
    if (!managedAsset) return { success: false, error: 'Site not found or you do not have owner access.' };

    const account = await db.account.findUnique({ where: { id: accountId }, select: { id: true } });
    if (!account) return { success: false, error: 'Account not found.' };

    await db.role.upsert({
      where: { id: `${assetId}:${accountId}:${role}` },
      create: { id: `${assetId}:${accountId}:${role}`, assetId, portfolioId: assetId, accountId, role },
      update: { status: 'active' },
    });

    revalidatePath('@neup/access');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to add access.' };
  }
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

    const [managedAssets, accounts] = await Promise.all([
      db.project.findMany({
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
            account: { select: { displayName: true, neupId: true } },
          },
        },
      },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      }),
      db.account.findMany({
        select: { id: true, displayName: true, neupId: true },
      }),
    ]);
    const accountMap = new Map(accounts.map((account) => [account.id, account]));

    const userMap = new Map<string, Map<string, { assetName: string; roles: Set<string>; isCurrentAsset: boolean; displayName: string; neupId: string | null }>>();
    const siteMap = new Map<string, { assetName: string; isCurrentAsset: boolean; users: Map<string, { roles: Set<string>; displayName: string; neupId: string | null }> }>();

    for (const asset of managedAssets) {
      const assetName = formatAssetName(asset.name, asset.id);
      const isCurrentAsset = asset.id === currentAssetId;
      const accessRows = asset.roles.map((role) => ({
        accountId: role.accountId,
        role: normalizeRole(role.role),
        displayName: role.account.displayName,
        neupId: role.account.neupId,
      }));

      if (asset.ownerAccountId?.trim()) {
        const ownerId = asset.ownerAccountId.trim();
        const ownerAlreadyPresent = accessRows.some((row) => row.accountId === ownerId && row.role === 'owner');
        if (!ownerAlreadyPresent) {
          const owner = accountMap.get(ownerId);
          accessRows.push({ accountId: ownerId, role: 'owner', displayName: owner?.displayName ?? '', neupId: owner?.neupId ?? null });
        }
      }

      for (const accessRow of accessRows) {
        if (!accessRow.accountId) continue;

        const userAssets = userMap.get(accessRow.accountId) ?? new Map<string, { assetName: string; roles: Set<string>; isCurrentAsset: boolean; displayName: string; neupId: string | null }>();
        const userAssetEntry = userAssets.get(asset.id) ?? {
          assetName,
          roles: new Set<string>(),
          isCurrentAsset,
          displayName: accessRow.displayName,
          neupId: accessRow.neupId,
        };
        userAssetEntry.roles.add(accessRow.role);
        userAssets.set(asset.id, userAssetEntry);
        userMap.set(accessRow.accountId, userAssets);

        const siteEntry = siteMap.get(asset.id) ?? {
          assetName,
          isCurrentAsset,
          users: new Map<string, { roles: Set<string>; displayName: string; neupId: string | null }>(),
        };
        const userEntry = siteEntry.users.get(accessRow.accountId) ?? { roles: new Set<string>(), displayName: accessRow.displayName, neupId: accessRow.neupId };
        userEntry.roles.add(accessRow.role);
        siteEntry.users.set(accessRow.accountId, userEntry);
        siteMap.set(asset.id, siteEntry);
      }
    }

    const users: AccessOverviewUser[] = Array.from(userMap.entries())
      .map(([userAccountId, assets]) => ({
        accountId: userAccountId,
        displayName: Array.from(assets.values())[0]?.displayName ?? '',
        neupId: Array.from(assets.values())[0]?.neupId ?? null,
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
            displayName: roles.displayName,
            neupId: roles.neupId,
            roles: Array.from(roles.roles).sort(),
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
