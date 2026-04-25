
'use server';

import { getPrivateServerDetails } from '@/services/servers';
import { NodeSSH } from 'node-ssh';
import { logErrorToDatabase } from '@/lib/logging';

export async function readFileContent(serverId: string, filePath: string): Promise<{ success: boolean; content?: string | null; error?: string }> {
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
    
    // Check if file exists and is a regular file
    const checkResult = await ssh.execCommand(`test -f '${filePath}'`);
    if (checkResult.code !== 0) {
        // Fallback for symlinks to files
        const checkLinkResult = await ssh.execCommand(`[ -f "$(readlink -f '${filePath}')" ]`);
        if (checkLinkResult.code !== 0) {
            return { success: false, error: 'File does not exist or is not a regular file.' };
        }
    }

    const result = await ssh.execCommand(`cat '${filePath}'`);
    if (result.code !== 0) {
      throw new Error(`Failed to read file: ${result.stderr}`);
    }
    
    return { success: true, content: result.stdout };

  } catch (error: any) {
    await logErrorToDatabase({
      message: `Failed to read file content for server ${serverId} at path ${filePath}: ${error.message}`,
      stack: error.stack,
      source: 'readFileContent',
    });
    return { success: false, error: error.message, content: null };
  } finally {
    if (ssh.isConnected()) {
      ssh.dispose();
    }
  }
}
