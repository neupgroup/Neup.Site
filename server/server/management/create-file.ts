
'use server';

import { getPrivateServerDetails } from '@/server/servers';
import { NodeSSH } from 'node-ssh';
import { logErrorToDatabase } from '@/lib/logging';

export async function createFile(serverId: string, filePath: string): Promise<{ success: boolean; error?: string }> {
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

    // Determine if sudo is needed based on path
    const userHome = server.username === 'root' ? '/root' : `/home/${server.username}`;
    const useSudo = !filePath.startsWith(userHome);
    const sanitizedFilePath = `'${filePath.replace(/'/g, "'\\''")}'`;

    const command = useSudo ? `sudo touch ${sanitizedFilePath}` : `touch ${sanitizedFilePath}`;
    
    const result = await ssh.execCommand(command);

    if (result.code !== 0) {
      throw new Error(`Failed to create file: ${result.stderr}`);
    }

    return { success: true };

  } catch (error: any) {
    await logErrorToDatabase({
      message: `Failed to create file for server ${serverId} at path ${filePath}: ${error.message}`,
      stack: error.stack,
      source: 'createFile',
    });
    return { success: false, error: error.message };
  } finally {
    if (ssh.isConnected()) {
      ssh.dispose();
    }
  }
}
