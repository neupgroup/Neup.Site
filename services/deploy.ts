
'use server';

import { cookies } from 'next/headers';
import { db } from '@/core/lib/db';
import { createServerLog } from '@/services/server-logs';

export async function deployCodebaseFromStorage(): Promise<{ success: boolean; error?: string; serverId?: string; logId?: string; }> {
  const cookieStore = await cookies();
  const assetId = cookieStore.get('assetId')?.value;
  if (!assetId) return { success: false, error: 'Asset ID not found.' };

  const allocation = await db.allocation.findFirst({ where: { assetId } });
  if (!allocation) return { success: false, error: 'No server allocated to this site.' };

  const createLogResult = await createServerLog({
    serverId: allocation.serverId,
    commandName: `Asset Deployment for site: ${assetId}`,
    command: 'Legacy asset deployment has been removed.',
    output: 'Use the server-based public file workflow instead.',
    status: 'cancelled',
    initiatedBy: 'system',
  });

  if (!createLogResult.success || !createLogResult.id) {
    return { success: false, error: `Failed to create log entry: ${createLogResult.error}` };
  }

  return {
    success: false,
    serverId: allocation.serverId,
    logId: createLogResult.id,
    error: 'Legacy asset deployment has been removed. Use the server-based public file workflow instead.',
  };
}
