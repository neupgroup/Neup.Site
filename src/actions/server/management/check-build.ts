
'use server';

import { getPrivateServerDetails } from '@/actions/servers';
import { NodeSSH } from 'node-ssh';
import { logErrorToFirestore } from '@/lib/logging';

export async function checkPathExists(serverId: string, path: string): Promise<{ exists: boolean; error?: string }> {
  const ssh = new NodeSSH();
  try {
    const { server, error: serverError } = await getPrivateServerDetails(serverId);
    if (serverError || !server) {
      throw new Error(`Failed to retrieve server credentials: ${serverError}`);
    }

    await ssh.connect({
      host: server.publicIp,
      username: server.username || 'root',
      privateKey: server.privateKey,
    });

    const result = await ssh.execCommand(`test -d '${path}'`);
    
    return { exists: result.code === 0 };

  } catch (error: any) {
    await logErrorToFirestore({
      message: `Failed to check path existence for server ${serverId} at path ${path}: ${error.message}`,
      stack: error.stack,
      source: 'checkPathExists',
    });
    return { exists: false, error: error.message };
  } finally {
    if (ssh.isConnected()) {
      ssh.dispose();
    }
  }
}

export async function rebuildApplication(serverId: string, appPath: string): Promise<{ success: boolean; error?: string }> {
    const ssh = new NodeSSH();
    try {
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

