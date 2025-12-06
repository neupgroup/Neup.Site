
'use server';

import { cookies } from 'next/headers';

/**
 * Clears the session cookies for the user.
 */
export async function logout(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.delete('siteId');
  cookieStore.delete('account_id');
}
