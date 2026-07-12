
'use server';

import { prisma as db } from '@/core/database/prisma';
import { logErrorToDatabase } from '@/core/lib/logging';
import { cookies } from 'next/headers';
import crypto from 'crypto';

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

export async function getAccountId(): Promise<string> {
    const cookieStore = await cookies();
    let accountId = cookieStore.get('account_id')?.value;
    if (!accountId) {
        accountId = `user_${crypto.randomBytes(8).toString('hex')}`;
        cookieStore.set('account_id', accountId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 365, // One year
            path: '/',
        });
    }
    return accountId;
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
        await logErrorToDatabase({
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
        await logErrorToDatabase({
            message: `Failed to delete linked account ${id} for user ${accountId}: ${e.message}`,
            stack: e.stack,
            source: 'deleteLinkedAccount',
        });
        return { success: false, error: 'Failed to disconnect account.' };
    }
}
