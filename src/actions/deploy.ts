
'use server';

import { cookies } from 'next/headers';
import { collection, query, where, getDocs, limit } from '@/lib/firestore';
import { getDataStore } from '@/lib/data-store';
import { createServerLog } from '@/actions/server-logs';

// This legacy entrypoint now records an informative log and exits.
export async function deployCodebaseFromStorage(): Promise<{ success: boolean; error?: string; serverId?: string; logId?: string; }> {
    const cookieStore = await cookies();
    const siteId = cookieStore.get('siteId')?.value;
    if (!siteId) return { success: false, error: 'Site ID not found.' };

    const { firestore } = getDataStore();

    // 1. Find the server allocation for this site
    const allocationsQuery = query(
        collection(firestore, 'allocations'),
        where('siteId', '==', siteId),
        limit(1)
    );
    const allocationsSnapshot = await getDocs(allocationsQuery);
    if (allocationsSnapshot.empty) {
        return { success: false, error: 'No server allocated to this site.' };
    }
    const allocation = allocationsSnapshot.docs[0].data();
    const serverId = allocation.serverId;

    const createLogResult = await createServerLog({
        serverId: serverId,
        commandName: `Asset Deployment for site: ${siteId}`,
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
        serverId,
        logId: createLogResult.id,
        error: 'Legacy asset deployment has been removed. Use the server-based public file workflow instead.',
    };
}
