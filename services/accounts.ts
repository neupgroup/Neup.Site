
'use server';

import { prisma as db } from '#/core/database/prisma';
import { logger } from '#/logica/logger';
import { ensureRecord, getBasics, isAuthenticated } from '#/logica/account/self';

export interface LinkedAccount {
    id: string;
    account_id: string;
    platform: 'github' | 'google';
    authorized_on: string | null;
    authorization_info: {
        access_token: string;
        refresh_token: string | null;
        scope: string;
        provider_user_id: string;
        provider_username: string;
    };
}

export interface SelfAccountBasics {
    displayName: string | null;
    displayImage: string | null;
    neupid: string | null;
}

export interface PlatformAccountSummary {
    id: string;
    displayName: string;
    displayImage: string;
    neupId: string | null;
    type: string;
    createdOn: string;
    status: string;
    moreDetails: unknown;
    roleCount: number;
}

export interface PlatformAccountSiteAccess {
    assetId: string;
    assetName: string;
    assetStatus: string | null;
    assetType: string | null;
    roles: string[];
    isOwner: boolean;
}

export interface PlatformAccountDetail {
    id: string;
    displayName: string;
    displayImage: string;
    neupId: string | null;
    type: string;
    createdOn: string;
    status: string;
    moreDetails: unknown;
    roleCount: number;
    accessibleSiteCount: number;
    ownedSiteCount: number;
    linkedAccountCount: number;
    apiTokenCount: number;
    sites: PlatformAccountSiteAccess[];
}

export async function getAccountId(authToken?: string | null): Promise<string> {
    const account = await ensureRecord(authToken);
    if (!account?.id) {
        throw new Error('Authenticated account not found.');
    }
    return account.id;
}

export async function getLinkedAccounts(): Promise<{ accounts?: LinkedAccount[], error?: string }> {
    const accountId = await getAccountId();
    if (!accountId) {
        // This case should ideally not happen if user is in the dashboard.
        // Returning an empty array is safer than throwing.
        return { accounts: [] };
    }
    try {
        const records = await db.linkedAccount.findMany({
            where: { account_id: accountId },
            orderBy: [{ authorized_on: 'desc' }, { id: 'asc' }],
        });

        const accounts = records.map((record) => ({
            id: record.id,
            account_id: record.account_id,
            platform: record.platform as LinkedAccount['platform'],
            authorized_on: record.authorized_on ? record.authorized_on.toISOString() : null,
            authorization_info: {
                access_token: record.accessToken,
                refresh_token: record.refreshToken ?? null,
                scope: record.scope,
                provider_user_id: record.providerUserId,
                provider_username: record.providerUsername,
            },
        })) as LinkedAccount[];
        return { accounts };
    } catch (e: any) {
        await logger.error({
            message: `Failed to get linked accounts for user ${accountId}: ${e.message}`,
            stack: e.stack,
            source: 'getLinkedAccounts',
        });
        return { error: 'Failed to retrieve linked accounts.' };
    }
}

export async function deleteLinkedAccount(id: string): Promise<{ success: boolean; error?: string }> {
    const accountId = await getAccountId();
    if (!accountId) {
        return { success: false, error: 'User not authenticated.' };
    }
    try {
        const result = await db.linkedAccount.deleteMany({
            where: { id, account_id: accountId },
        });
        if (result.count === 0) {
            return { success: false, error: 'Unauthorized or account not found.' };
        }
        return { success: true };
    } catch (e: any) {
        await logger.error({
            message: `Failed to delete linked account ${id} for user ${accountId}: ${e.message}`,
            stack: e.stack,
            source: 'deleteLinkedAccount',
        });
        return { success: false, error: 'Failed to disconnect account.' };
    }
}

export async function getSelfAccountBasics(): Promise<{ basics?: SelfAccountBasics | null; error?: string }> {
    try {
        const authentication = await isAuthenticated();
        if (!authentication.authenticated) {
            return { basics: null };
        }

        const account = await ensureRecord();
        if (account) {
            return {
                basics: {
                    displayName: account.displayName || null,
                    displayImage: account.displayImage || null,
                    neupid: account.neupId || null,
                },
            };
        }

        const basics = await getBasics();
        return { basics: basics[0] ?? null };
    } catch (e: any) {
        await logger.error({
            message: `Failed to get self account basics: ${e.message}`,
            stack: e.stack,
            source: 'getSelfAccountBasics',
        });
        return { error: 'Failed to retrieve account basics.' };
    }
}

export async function getPlatformAccounts(): Promise<{ accounts?: PlatformAccountSummary[]; error?: string }> {
    try {
        await ensureRecord();

        const records = await db.account.findMany({
            select: {
                id: true,
                displayName: true,
                displayImage: true,
                neupId: true,
                type: true,
                createdOn: true,
                status: true,
                moreDetails: true,
                roles: {
                    select: {
                        id: true,
                    },
                },
            },
            orderBy: {
                id: 'asc',
            },
        });

        return {
            accounts: records.map((record) => ({
                id: record.id,
                displayName: record.displayName,
                displayImage: record.displayImage,
                neupId: record.neupId,
                type: record.type,
                createdOn: record.createdOn.toISOString(),
                status: record.status,
                moreDetails: record.moreDetails,
                roleCount: record.roles.length,
            })),
        };
    } catch (e: any) {
        await logger.error({
            message: `Failed to get platform accounts: ${e.message}`,
            stack: e.stack,
            source: 'getPlatformAccounts',
        });
        return { error: 'Failed to retrieve platform accounts.' };
    }
}

export async function getPlatformAccount(id: string): Promise<{ account?: PlatformAccountDetail | null; error?: string }> {
    try {
        await ensureRecord();

        const [record, linkedAccountCount, apiTokenCount] = await Promise.all([
            db.account.findUnique({
                where: { id },
                select: {
                    id: true,
                    displayName: true,
                    displayImage: true,
                    neupId: true,
                    type: true,
                    createdOn: true,
                    status: true,
                    moreDetails: true,
                    roles: {
                        select: {
                            role: true,
                            asset: {
                                select: {
                                    id: true,
                                    name: true,
                                    status: true,
                                    type: true,
                                    ownerAccountId: true,
                                },
                            },
                        },
                    },
                },
            }),
            db.linkedAccount.count({
                where: { account_id: id },
            }),
            db.apiToken.count({
                where: { accountId: id },
            }),
        ]);

        if (!record) {
            return { account: null };
        }

        const siteMap = new Map<string, PlatformAccountSiteAccess>();

        for (const role of record.roles) {
            const existing = siteMap.get(role.asset.id);

            if (existing) {
                if (!existing.roles.includes(role.role)) {
                    existing.roles.push(role.role);
                }
                existing.isOwner = existing.isOwner || role.asset.ownerAccountId === record.id;
                continue;
            }

            siteMap.set(role.asset.id, {
                assetId: role.asset.id,
                assetName: role.asset.name || role.asset.id,
                assetStatus: role.asset.status ?? null,
                assetType: role.asset.type ?? null,
                roles: [role.role],
                isOwner: role.asset.ownerAccountId === record.id,
            });
        }

        const sites = Array.from(siteMap.values()).sort((left, right) => left.assetName.localeCompare(right.assetName));

        return {
            account: {
                id: record.id,
                displayName: record.displayName,
                displayImage: record.displayImage,
                neupId: record.neupId,
                type: record.type,
                createdOn: record.createdOn.toISOString(),
                status: record.status,
                moreDetails: record.moreDetails,
                roleCount: record.roles.length,
                accessibleSiteCount: sites.length,
                ownedSiteCount: sites.filter((site) => site.isOwner).length,
                linkedAccountCount,
                apiTokenCount,
                sites,
            },
        };
    } catch (e: any) {
        await logger.error({
            message: `Failed to get platform account ${id}: ${e.message}`,
            stack: e.stack,
            source: 'getPlatformAccount',
        });
        return { error: 'Failed to retrieve account details.' };
    }
}
