'use server';

import { getPrivateServerDetails } from '@/actions/servers';
import { getSite } from '@/actions/editor/site';

export async function resolveAppPath(serverId: string): Promise<{ resolvedPath: string, error?: string, siteId?: string }> {
    const { server, error: serverError } = await getPrivateServerDetails(serverId);
    if (serverError || !server) {
        return { resolvedPath: '', error: 'Could not retrieve server details for path resolution.' };
    }

    const { site, error: siteError } = await getSite();
    if (siteError || !site) {
        return { resolvedPath: '', error: 'Could not retrieve site details for path resolution.' };
    }

    let resolvedPath = server.appPath || `/var/www/{{universal.site_id}}`;

    const variables: Record<string, string> = {
        '{{universal.site_id}}': site.id,
        '{{server.username}}': server.username || 'root',
    };

    for (const [key, value] of Object.entries(variables)) {
        resolvedPath = resolvedPath.replace(new RegExp(key.replace(/\{|\}/g, '\\$&'), 'g'), value);
    }

    return { resolvedPath, siteId: site.id };
}
