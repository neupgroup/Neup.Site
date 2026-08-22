
'use server';

import { ensureRecord } from '@/logica/account/self';

/**
 * Ensures the authenticated account is synchronized into the local accounts table.
 */
export async function initializeUserAccount(): Promise<{ accountId: string | null; }> {
  const account = await ensureRecord();
  return { accountId: account?.id ?? null };
}
