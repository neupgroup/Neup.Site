
'use server';

import { getPrivateServerDetails } from '@/actions/servers';
import { NodeSSH } from 'node-ssh';
import { logErrorToFirestore } from '@/lib/logging';

export interface StorageInfo {
  filesystem: string;
  size: string;
  used: string;
  available: string;
  usePercentage: string;
  mountedOn: string;
}

function parseDfOutput(output: string): StorageInfo | null {
  const lines = output.trim().split('\n');
  if (lines.length < 2) return null;

  const dataLine = lines[1].split(/\s+/);
  if (dataLine.length < 6) return null;

  return {
    filesystem: dataLine[0],
    size: dataLine[1],
    used: dataLine[2],
    available: dataLine[3],
    usePercentage: dataLine[4],
    mountedOn: dataLine[5],
  };
}

export async function getDetailedStorageForServer(serverId: string): Promise<{ success: boolean; data?: StorageInfo; error?: string }> {
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

    const result = await ssh.execCommand("df -h /");
    if (result.code !== 0) {
      throw new Error(`df command failed: ${result.stderr}`);
    }

    const storageData = parseDfOutput(result.stdout);
    if (!storageData) {
        throw new Error('Failed to parse df output.');
    }

    return { success: true, data: storageData };

  } catch (error: any) {
    await logErrorToFirestore({
      message: `Failed to get detailed storage for server ${serverId}: ${error.message}`,
      stack: error.stack,
      source: 'getDetailedStorageForServer',
    });
    return { success: false, error: error.message };
  } finally {
    if (ssh.isConnected()) {
      ssh.dispose();
    }
  }
}
