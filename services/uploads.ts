
'use server';

import { getSiteServers } from '@/services/servers';
import { getPrivateServerDetails } from '@/services/servers';
import { NodeSSH } from 'node-ssh';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { logErrorToDatabase } from '@/core/lib/logging';
import { getAsset } from './editor/asset';

export interface PublicFile {
  name: string;
  path: string; // Relative path from the app's public folder
  type: 'file' | 'directory';
  size?: number; // in bytes
  modified?: Date;
}

async function getRemoteServerConnection(assetId: string) {
    const serverResult = await getSiteServers();
    if (!serverResult.success || !serverResult.servers || serverResult.servers.length === 0) {
        throw new Error('No server is allocated to this asset.');
    }
    const serverId = serverResult.servers[0].id;
    const { server, error } = await getPrivateServerDetails(serverId);
    if (error || !server) {
        throw new Error(`Failed to get server credentials: ${error}`);
    }

    const { asset } = await getAsset();
    if (!asset) {
        throw new Error('Could not resolve asset context.');
    }

    const appPath =
        server.appPath?.replace(/\{\{\s*universal\.(?:site_id|asset_id)\s*\}\}/g, asset.id) ||
        `/var/www/${asset.id}`;
    const publicPath = `${appPath}/public`;

    const ssh = new NodeSSH();
    await ssh.connect({
        host: server.publicIp,
        username: server.username || 'root',
        privateKey: server.privateKey,
    });

    return { ssh, publicPath, serverId };
}


/**
 * Gets the list of files and directories within a given path inside the public folder on the remote server.
 */
export async function getPublicFiles(directoryPath: string = '/'): Promise<{ success: boolean; files?: PublicFile[]; error?: string }> {
    let ssh: NodeSSH | undefined;
    const assetId = 'current-site'; // Placeholder, as getRemoteServerConnection will use the cookie

    try {
        const connection = await getRemoteServerConnection(assetId);
        ssh = connection.ssh;
        const remoteBaseDir = connection.publicPath;
        
        // Sanitize path to prevent directory traversal attacks
        const sanitizedRelativePath = path.posix.normalize(directoryPath).replace(/^(\.\.[\/\\])+/, '');
        const remoteFullPath = path.posix.join(remoteBaseDir, sanitizedRelativePath);


        const result = await ssh.execCommand(`ls -la --full-time ${remoteFullPath}`);
        if (result.code !== 0) {
            throw new Error(`Failed to list files: ${result.stderr}`);
        }

        const files: PublicFile[] = result.stdout.trim().split('\n').slice(1).map(line => {
            const parts = line.split(/\s+/);
            const type = parts[0][0] === 'd' ? 'directory' : 'file';
            const name = parts.slice(8).join(' ');
            const size = parseInt(parts[4], 10);
            
             if (name === '.' || name === '..') {
                return null;
            }

            return {
                name,
                path: path.posix.join(sanitizedRelativePath, name),
                type,
                size,
                modified: new Date(`${parts[5]} ${parts[6]}`),
            };
        }).filter((file): file is PublicFile => file !== null)
        .sort((a, b) => {
            if (a.type === 'directory' && b.type !== 'directory') return -1;
            if (a.type !== 'directory' && b.type === 'directory') return 1;
            return a.name.localeCompare(b.name);
        });

        return { success: true, files };
    } catch (e: any) {
        await logErrorToDatabase({ message: `Failed to read remote public directory at ${directoryPath}: ${e.message}`, source: 'getPublicFiles' });
        return { success: false, error: `Could not read directory. ${e.message}` };
    } finally {
        ssh?.dispose();
    }
}

/**
 * Deletes a file or directory from the public folder on the remote server.
 */
export async function deletePublicFile(relativePath: string): Promise<{ success: boolean; error?: string }> {
     let ssh: NodeSSH | undefined;
     const assetId = 'current-site'; // Placeholder
    
    try {
        const { ssh: sshConnection, publicPath: remoteBaseDir } = await getRemoteServerConnection(assetId);
        ssh = sshConnection;

        const remoteFullPath = path.posix.join(remoteBaseDir, relativePath);

        // Basic safety check
        if (!remoteFullPath.startsWith(remoteBaseDir) || remoteFullPath === remoteBaseDir) {
            return { success: false, error: 'Access denied. Cannot delete root public folder.' };
        }
        
        await ssh.execCommand(`rm -rf "${remoteFullPath}"`);

        return { success: true };
    } catch (e: any) {
        await logErrorToDatabase({ message: `Failed to delete remote path ${relativePath}: ${e.message}`, source: 'deletePublicFile' });
        return { success: false, error: 'Failed to delete path.' };
    } finally {
        ssh?.dispose();
    }
}
