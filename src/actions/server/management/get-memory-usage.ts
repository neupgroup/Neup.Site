
'use server';

import { getPrivateServerDetails } from '@/actions/servers';
import { NodeSSH } from 'node-ssh';
import { logErrorToFirestore } from '@/lib/logging';

interface MemoryInfo {
  total: number;
  used: number;
  free: number;
  shared: number;
  buffCache: number;
  available: number;
  unit: string;
}

function parseFreeOutput(output: string): MemoryInfo | null {
  const lines = output.trim().split('\n');
  if (lines.length < 2) return null;

  const memLine = lines[1].split(/\s+/);
  if (memLine.length < 7) return null;

  return {
    total: parseInt(memLine[1], 10),
    used: parseInt(memLine[2], 10),
    free: parseInt(memLine[3], 10),
    shared: parseInt(memLine[4], 10),
    buffCache: parseInt(memLine[5], 10),
    available: parseInt(memLine[6], 10),
    unit: 'MB',
  };
}

export async function getMemoryUsage(serverId: string): Promise<{ success: boolean; data?: MemoryInfo; error?: string; }> {
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

    // Use `free -m` to get memory usage in megabytes
    const result = await ssh.execCommand("free -m");

    if (result.code !== 0 || !result.stdout) {
      throw new Error(`Command failed: ${result.stderr}`);
    }
    
    const memoryData = parseFreeOutput(result.stdout);
    if (!memoryData) {
        throw new Error('Failed to parse `free -m` output.');
    }

    return { success: true, data: memoryData };

  } catch (error: any) {
    await logErrorToFirestore({
      message: `Failed to get memory usage for server ${serverId}: ${error.message}`,
      stack: error.stack,
      source: 'getMemoryUsage',
    });
    return { success: false, error: error.message };
  } finally {
    if (ssh.isConnected()) {
      ssh.dispose();
    }
  }
}
