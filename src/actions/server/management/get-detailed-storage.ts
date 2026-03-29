
'use server';

import { getPrivateServerDetails } from '@/actions/servers';
import { NodeSSH } from 'node-ssh';
import { logErrorToDatabase } from '@/lib/logging';
import type { ServerAllocationStorage } from '@/schemas/server';

function parseDuOutput(output: string): { value: number; unit: string } {
    const match = output.match(/^([\d,.]+)([GMK]?)/);
    if (!match) return { value: 0, unit: 'B' };
    return { value: parseFloat(match[1].replace(',', '.')), unit: match[2] || 'B' };
}

function parseDfOutput(output: string): { total: number; available: number; unit: string } {
    const lines = output.trim().split('\n');
    if (lines.length < 2) throw new Error('Invalid df output');
    
    const dataLine = lines[1].split(/\s+/);
    if (dataLine.length < 2) throw new Error('Invalid df data line');

    const totalStr = dataLine[0];
    const availableStr = dataLine[1];
    
    const total = parseFloat(totalStr);
    const available = parseFloat(availableStr);
    const unit = totalStr.slice(-1);

    return { total, available, unit };
}

export async function getDetailedStorage(
  allocationId: string,
  serverId: string,
  deploymentPath: string,
  username?: string
): Promise<{ success: boolean; data?: ServerAllocationStorage; error?: string }> {
  const ssh = new NodeSSH();
  try {
    const { server, error: serverError } = await getPrivateServerDetails(serverId);
    if (serverError || !server || !server.publicIp || !server.privateKey) {
      throw new Error(`Failed to retrieve server credentials: ${serverError || 'Missing IP or private key.'}`);
    }

    await ssh.connect({
      host: server.publicIp,
      username: username || server.username || 'root',
      privateKey: server.privateKey,
    });

    const dfResult = await ssh.execCommand("df -BG / | awk 'NR==2{print $2, $4}'");
    if (dfResult.code !== 0) throw new Error(`df command failed: ${dfResult.stderr}`);
    
    const [totalStr, availStr] = dfResult.stdout.split(' ');
    const totalStorageVal = parseFloat(totalStr.replace('G', ''));
    const availableStorageVal = parseFloat(availStr.replace('G', ''));
    const unit = 'GB';

    const usedStorageVal = totalStorageVal - availableStorageVal;
    
    const deploymentPathResult = await ssh.execCommand(`du -shm ${deploymentPath}`);
    const deploymentSize = deploymentPathResult.code === 0 ? parseFloat(deploymentPathResult.stdout) / 1024 : 0;
    
    const assetsPath = `${deploymentPath}/src/app/assets`;
    const assetsResult = await ssh.execCommand(`du -shm ${assetsPath}`);
    const assetsSize = assetsResult.code === 0 ? parseFloat(assetsResult.stdout) / 1024 : 0;
    
    const codebaseStorage = Math.max(0, deploymentSize - assetsSize);
    const systemStorage = Math.max(0, usedStorageVal - deploymentSize);

    const storageData: ServerAllocationStorage = {
      totalStorage: totalStorageVal.toFixed(2),
      availableStorage: availableStorageVal.toFixed(2),
      systemStorage: systemStorage.toFixed(2),
      codebaseStorage: codebaseStorage.toFixed(2),
      assetsStorage: assetsSize.toFixed(2),
      unit: unit,
    };
    
    // The responsibility to save this data has been removed from this function
    // as it's no longer part of the allocation schema.

    return { success: true, data: storageData };

  } catch (error: any) {
    await logErrorToDatabase({
      message: `Failed to get detailed storage for server ${serverId}: ${error.message}`,
      stack: error.stack,
      source: 'getDetailedStorage',
    });
    return { success: false, error: error.message };
  } finally {
    if (ssh.isConnected()) {
      ssh.dispose();
    }
  }
}
