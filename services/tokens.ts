
'use server';

import { db } from '@/lib/db';
import { logErrorToDatabase } from '@/lib/logging';
import { getAccountId } from './accounts';
import { revalidatePath } from 'next/cache';
import { ApiToken } from '@/schemas/token';

export async function createToken(name: string, tokenHash: string, tokenPrefix: string): Promise<{ success: boolean; id?: string; error?: string }> {
  const accountId = await getAccountId();
  if (!accountId) {
    return { success: false, error: 'User not authenticated.' };
  }

  try {
    const record = await db.apiToken.create({
      data: {
        accountId,
        name,
        tokenHash,
        tokenPrefix,
        createdAt: new Date(),
        lastUsed: null,
      },
      select: { id: true },
    });
    revalidatePath('/settings/tokens');
    return { success: true, id: record.id };
  } catch (e: any) {
    await logErrorToDatabase({
      message: `Failed to create token: ${e.message}`,
      stack: e.stack,
      source: 'createToken',
    });
    return { success: false, error: 'Failed to create token.' };
  }
}

export async function getTokens(): Promise<{ success: boolean; tokens?: ApiToken[]; error?: string }> {
  const accountId = await getAccountId();
  if (!accountId) {
    return { success: false, error: 'User not authenticated.' };
  }

  try {
    const records = await db.apiToken.findMany({
      where: { accountId },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    });

    const tokens = records.map((record) => ({
      id: record.id,
      accountId: record.accountId,
      name: record.name,
      token: `${record.tokenPrefix}...`,
      createdAt: record.createdAt ? record.createdAt.toISOString() : null,
      lastUsed: record.lastUsed ? record.lastUsed.toISOString() : null,
    })) as ApiToken[];
    return { success: true, tokens };
  } catch (e: any) {
    await logErrorToDatabase({
      message: `Failed to get tokens: ${e.message}`,
      stack: e.stack,
      source: 'getTokens',
    });
    return { success: false, error: 'Failed to fetch tokens.' };
  }
}

export async function revokeToken(id: string): Promise<{ success: boolean; error?: string }> {
  const accountId = await getAccountId();
  if (!accountId) {
    return { success: false, error: 'User not authenticated.' };
  }

  try {
    const result = await db.apiToken.deleteMany({ where: { id, accountId } });
    if (result.count === 0) {
      return { success: false, error: 'Unauthorized or token not found.' };
    }
    revalidatePath('/settings/tokens');
    return { success: true };
  } catch (e: any) {
    await logErrorToDatabase({
      message: `Failed to revoke token: ${e.message}`,
      stack: e.stack,
      source: 'revokeToken',
    });
    return { success: false, error: 'Failed to revoke token.' };
  }
}
