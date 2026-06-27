
'use server';

import { cookies } from 'next/headers';

/**
 * Clears the session cookies for the user.
 */
export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('assetId');
  cookieStore.delete('account_id');
}
