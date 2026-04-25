
'use server';

import { getPrivateServerDetails } from '@/services/servers';
import { NodeSSH } from 'node-ssh';
import { logErrorToDatabase } from '@/lib/logging';

export async function deletePath(serverId: string, path: string): Promise<{ success: boolean; error?: string }> {
  if (!path || path === '/') {
    return { success: false, error: "Cannot delete the root directory." };
  }
  
  // Add more safety checks if needed, e.g., for system directories
  if (['/etc', '/bin', '/usr', '/var'].includes(path)) {
      return { success: false, error: `Deleting system directory '${path}' is not allowed.`};
  }

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
    
    // Sanitize path to prevent command injection
    const sanitizedPath = `'${path.replace(/'/g, "'\\''")}'`;
    const command = `rm -rf ${sanitizedPath}`;
    
    const result = await ssh.execCommand(command);

    if (result.code !== 0) {
      throw new Error(`Failed to delete path: ${result.stderr}`);
    }

    return { success: true };

  } catch (error: any) {
    await logErrorToDatabase({
      message: `Failed to delete path for server ${serverId} at path ${path}: ${error.message}`,
      stack: error.stack,
      source: 'deletePath',
    });
    return { success: false, error: error.message };
  } finally {
    if (ssh.isConnected()) {
      ssh.dispose();
    }
  }
}
