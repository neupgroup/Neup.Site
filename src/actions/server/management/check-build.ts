
'use server';

import { getPrivateServerDetails } from '@/actions/servers';
import { NodeSSH } from 'node-ssh';
import { logErrorToFirestore } from '@/lib/logging';
import { getSite } from '@/actions/editor/site';

async function resolveAppPath(serverId: string): Promise<string> {
    const { server, error } = await getPrivateServerDetails(serverId);
    if (error || !server) {
        throw new Error('Could not retrieve server details for path resolution.');
    }

    const { site } = await getSite();
    if (!site) {
        throw new Error('Could not retrieve site details for path resolution.');
    }

    let resolvedPath = server.appPath || `/var/www/{{universal.site_id}}`;

    const variables: Record<string, string> = {
        '{{universal.site_id}}': site.id,
        '{{server.username}}': server.username || 'root',
        // Add any other variables that might appear in appPath
    };

    for (const [key, value] of Object.entries(variables)) {
        resolvedPath = resolvedPath.replace(new RegExp(key, 'g'), value);
    }
    
    return resolvedPath;
}


export async function checkPathExists(serverId: string, path?: string): Promise<{ exists: boolean; error?: string, resolvedPath?: string }> {
  const ssh = new NodeSSH();
  let pathToCheck = path;

  try {
    const { server, error: serverError } = await getPrivateServerDetails(serverId);
    if (serverError || !server) {
      throw new Error(`Failed to retrieve server credentials: ${serverError}`);
    }
    
    if (!pathToCheck) {
        pathToCheck = await resolveAppPath(serverId);
    }

    await ssh.connect({
      host: server.publicIp,
      username: server.username || 'root',
      privateKey: server.privateKey,
    });

    const result = await ssh.execCommand(`test -d '${pathToCheck}'`);
    
    return { exists: result.code === 0, resolvedPath: pathToCheck };

  } catch (error: any) {
    await logErrorToFirestore({
      message: `Failed to check path existence for server ${serverId} at path ${pathToCheck}: ${error.message}`,
      stack: error.stack,
      source: 'checkPathExists',
    });
    return { exists: false, error: error.message, resolvedPath: pathToCheck };
  } finally {
    if (ssh.isConnected()) {
      ssh.dispose();
    }
  }
}

export async function rebuildApplication(serverId: string): Promise<{ success: boolean; error?: string }> {
    const ssh = new NodeSSH();
    let appPath = '';
    try {
        appPath = await resolveAppPath(serverId);

        const { server, error: serverError } = await getPrivateServerDetails(serverId);
        if (serverError || !server) {
        throw new Error(`Failed to retrieve server credentials: ${serverError}`);
        }

        await ssh.connect({
        host: server.publicIp,
        username: server.username || 'root',
        privateKey: server.privateKey,
        });

        const command = `
            set -e
            echo "--- Starting Rebuild ---"
            cd '${appPath}'
            echo "Deleting .next folder..."
            rm -rf .next
            echo "Running build..."
            npm run build
            echo "--- Rebuild Complete ---"
        `;

        const result = await ssh.execCommand(command);

        if (result.code !== 0) {
            throw new Error(`Rebuild failed: ${result.stderr}`);
        }

        return { success: true };

    } catch (error: any) {
        await logErrorToFirestore({
            message: `Failed to rebuild application for server ${serverId} at path ${appPath}: ${error.message}`,
            stack: error.stack,
            source: 'rebuildApplication',
        });
        return { success: false, error: error.message };
    } finally {
        if (ssh.isConnected()) {
        ssh.dispose();
        }
    }
}
