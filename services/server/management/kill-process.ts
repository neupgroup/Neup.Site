
'use server';

import { getPrivateServerDetails } from '@/services/servers';
import { NodeSSH } from 'node-ssh';
import { logErrorToDatabase } from '@/core/helpers/logger';

export async function killProcess(serverId: string, pid: number): Promise<{ success: boolean; error?: string }> {
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

    // Using 'kill' (SIGTERM) for a graceful shutdown. 
    // For a forceful kill, 'kill -9' could be used, but this is safer.
    const command = `kill ${pid}`;
    
    const result = await ssh.execCommand(command);

    if (result.code !== 0) {
      // It's possible the process ended before the command ran.
      // We can check the error message. If it says "No such process", it's not a true error.
      if (result.stderr && result.stderr.includes('No such process')) {
        return { success: true };
      }
      throw new Error(`Failed to kill process ${pid}: ${result.stderr}`);
    }

    return { success: true };

  } catch (error: any) {
    await logErrorToDatabase({
      message: `Failed to kill process ${pid} for server ${serverId}: ${error.message}`,
      stack: error.stack,
      source: 'killProcess',
    });
    return { success: false, error: error.message };
  } finally {
    if (ssh.isConnected()) {
      ssh.dispose();
    }
  }
}
