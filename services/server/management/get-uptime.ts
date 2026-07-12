
'use server';

import { getPrivateServerDetails } from '@/services/servers';
import { NodeSSH } from 'node-ssh';
import { logErrorToDatabase } from '@/core/helpers/logger';

export async function getUptime(serverId: string): Promise<{ success: boolean; uptime?: string; error?: string }> {
  const ssh = new NodeSSH();
  try {
    const { server, error: serverError } = await getPrivateServerDetails(serverId);
    if (serverError || !server || !server.publicIp || !server.privateKey) {
      throw new Error(`Failed to retrieve server credentials: ${serverError || 'Missing IP or private key.'}`);
    }

    await ssh.connect({
      host: server.publicIp,
      username: server.username || 'root',
      privateKey: server.privateKey,
    });

    const result = await ssh.execCommand("uptime -p");

    if (result.code !== 0) {
      throw new Error(`uptime command failed: ${result.stderr}`);
    }

    const uptime = result.stdout.trim().replace(/^up\s+/, '');

    return { success: true, uptime };

  } catch (error: any) {
    await logErrorToDatabase({
      message: `Failed to get uptime for server ${serverId}: ${error.message}`,
      stack: error.stack,
      source: 'getUptime',
    });
    return { success: false, error: error.message };
  } finally {
    if (ssh.isConnected()) {
      ssh.dispose();
    }
  }
}
