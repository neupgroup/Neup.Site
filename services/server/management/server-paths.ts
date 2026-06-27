'use server';

import { getPrivateServerDetails } from '@/services/servers';
import { getAsset } from '@/services/editor/asset';

export async function resolveAppPath(serverId: string, isProduction: boolean = true): Promise<{ resolvedPath: string, error?: string, assetId?: string }> {
    const { server, error: serverError } = await getPrivateServerDetails(serverId);
    if (serverError || !server) {
        return { resolvedPath: '', error: 'Could not retrieve server details for path resolution.' };
    }

    const { asset, error: assetError } = await getAsset();
    if (assetError || !asset) {
        return { resolvedPath: '', error: 'Could not retrieve asset details for path resolution.' };
    }

    let resolvedPath = server.appPath || `/var/www/{{universal.asset_id}}`;

    const variables: Record<string, string> = {
        '{{universal.site_id}}': asset.id, // backwards-compatible
        '{{universal.asset_id}}': asset.id,
        '{{server.username}}': server.username || 'root',
    };

    for (const [key, value] of Object.entries(variables)) {
        resolvedPath = resolvedPath.replace(new RegExp(key.replace(/\{|\}/g, '\\$&'), 'g'), value);
    }

    // Append .development for development servers
    if (!isProduction) {
        resolvedPath = `${resolvedPath}.development`;
    }

    return { resolvedPath, assetId: asset.id };
}
