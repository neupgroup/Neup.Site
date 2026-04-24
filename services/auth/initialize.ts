
'use server';

import { getAccountId } from '@/services/accounts';

/**
 * Ensures an account ID exists for the current user session.
 * This can be called when a user first interacts with the application.
 */
export async function initializeUserAccount(): Promise<{ accountId: string; }> {
  const accountId = await getAccountId();
  return { accountId };
}
