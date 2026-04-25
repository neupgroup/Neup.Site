'use server';

import { getPrivateServerDetails } from '@/services/servers';
import { getArtifact } from '@/services/editor/artifact';

export async function resolveAppPath(serverId: string, isProduction: boolean = true): Promise<{ resolvedPath: string, error?: string, artifactId?: string }> {
    const { server, error: serverError } = await getPrivateServerDetails(serverId);
    if (serverError || !server) {
        return { resolvedPath: '', error: 'Could not retrieve server details for path resolution.' };
    }

    const { artifact, error: artifactError } = await getArtifact();
    if (artifactError || !artifact) {
        return { resolvedPath: '', error: 'Could not retrieve artifact details for path resolution.' };
    }

    let resolvedPath = server.appPath || `/var/www/{{universal.artifact_id}}`;

    const variables: Record<string, string> = {
        '{{universal.site_id}}': artifact.id, // backwards-compatible
        '{{universal.artifact_id}}': artifact.id,
        '{{server.username}}': server.username || 'root',
    };

    for (const [key, value] of Object.entries(variables)) {
        resolvedPath = resolvedPath.replace(new RegExp(key.replace(/\{|\}/g, '\\$&'), 'g'), value);
    }

    // Append .development for development servers
    if (!isProduction) {
        resolvedPath = `${resolvedPath}.development`;
    }

    return { resolvedPath, artifactId: artifact.id };
}
