
'use server';

import { getPrivateServerDetails } from '@/services/servers';
import { NodeSSH } from 'node-ssh';
import { logger } from '@/logica/logger';

export async function saveFileContent(serverId: string, filePath: string, content: string): Promise<{ success: boolean; error?: string }> {
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
    
    // Check if the path is within the user's home directory.
    const userHome = `/home/${server.username}`;
    const useSudo = !filePath.startsWith(userHome);
    
    const command = useSudo ? 'sudo tee' : 'tee';
    
    // Use 'tee' to write content with appropriate privileges
    await ssh.exec(command, [filePath], {
        stdin: content
    });

    return { success: true };

  } catch (error: any) {
    await logger.error({
      message: `Failed to save file content for server ${serverId} at path ${filePath}: ${error.message}`,
      stack: error.stack,
      source: 'saveFileContent',
    });
    return { success: false, error: error.message };
  } finally {
    if (ssh.isConnected()) {
      ssh.dispose();
    }
  }
}
