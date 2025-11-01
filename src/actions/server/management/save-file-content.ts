
'use server';

import { getPrivateServerDetails } from '@/actions/servers';
import { NodeSSH } from 'node-ssh';
import { logErrorToFirestore } from '@/lib/logging';

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
    
    // Use exec to write content to the server via stdin
    await ssh.exec('tee', [filePath], {
        stdin: content
    });

    return { success: true };

  } catch (error: any) {
    await logErrorToFirestore({
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
