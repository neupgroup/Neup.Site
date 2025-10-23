
'use server';

import { getPrivateServerDetails, updateServer } from '@/actions/servers';
import { NodeSSH } from 'node-ssh';
import { logErrorToFirestore } from '@/lib/logging';

export async function getStorageUsage(serverId: string): Promise<{ success: boolean; data?: { used: string; total: string; unit: string }; error?: string; }> {
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

    if (result.code !== 0 || !result.stdout) {
      throw new Error(`Command failed: ${result.stderr}`);
    }
    
    const lines = result.stdout.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('Unexpected output from df -h');
    }

    const dataLine = lines[1].split(/\s+/);
    const total = dataLine[1];
    const used = dataLine[2];
    
    // Extract unit, assuming it's the last letter (G, T, M)
    const unit = total.slice(-1);

    const storageData = {
      used: used.slice(0, -1),
      total: total.slice(0, -1),
      unit: unit,
    };
    
    // Persist to Firestore
    await updateServer(serverId, {
        storageUsed: storageData.used,
        storageTotal: storageData.total,
        storageUnit: storageData.unit,
    });

    return { success: true, data: storageData };

  } catch (error: any) {
    await logErrorToFirestore({
      message: `Failed to get storage usage for server ${serverId}: ${error.message}`,
      stack: error.stack,
      source: 'getStorageUsage',
    });
    return { success: false, error: error.message };
  } finally {
    if (ssh.isConnected()) {
      ssh.dispose();
    }
  }
}
