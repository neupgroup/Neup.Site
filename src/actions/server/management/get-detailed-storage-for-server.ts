
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

export interface UserStorageInfo {
    name: string;
    used: string;
}

export interface SwapInfo {
    total: string;
    used: string;
    free: string;
}

export interface DetailedStorageInfo {
    total: StorageInfo;
    system: { used: string };
    users: UserStorageInfo[];
    swap: SwapInfo;
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

function parseDuOutput(output: string): UserStorageInfo[] {
    return output.trim().split('\n').map(line => {
        const [size, path] = line.split(/\s+/);
        const name = path.split('/').pop() || 'unknown';
        return { name, used: size };
    });
}

function parseFreeOutput(output: string): SwapInfo | null {
    const lines = output.trim().split('\n');
    const swapLine = lines.find(line => line.startsWith('Swap:'));
    if (!swapLine) return null;

    const parts = swapLine.split(/\s+/);
    return {
        total: `${parts[1]}M`,
        used: `${parts[2]}M`,
        free: `${parts[3]}M`,
    };
}

export async function getDetailedStorageForServer(serverId: string): Promise<{ success: boolean; data?: DetailedStorageInfo; error?: string }> {
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

    const [dfResult, duResult, freeResult] = await Promise.all([
        ssh.execCommand("df -h /"),
        ssh.execCommand("du -sh /home/*"),
        ssh.execCommand("free -m"),
    ]);

    if (dfResult.code !== 0) throw new Error(`df command failed: ${dfResult.stderr}`);
    const total = parseDfOutput(dfResult.stdout);
    if (!total) throw new Error('Failed to parse df output.');
    
    const users = duResult.code === 0 ? parseDuOutput(duResult.stdout) : [];
    const swap = freeResult.code === 0 ? parseFreeOutput(freeResult.stdout) : { total: '0M', used: '0M', free: '0M' };
    if (!swap) throw new Error('Failed to parse free output.');

    // Calculate system usage
    const totalUsedBytes = parseFloat(total.used) * (total.used.includes('G') ? 1024*1024*1024 : 1024*1024);
    const usersUsedBytes = users.reduce((acc, user) => {
        const size = parseFloat(user.used);
        const unit = user.used.slice(-1);
        const multiplier = unit === 'G' ? 1024*1024*1024 : unit === 'M' ? 1024*1024 : 1024;
        return acc + (size * multiplier);
    }, 0);

    const systemUsedBytes = totalUsedBytes - usersUsedBytes;
    const systemUsedGb = (systemUsedBytes / (1024*1024*1024)).toFixed(2);


    return { success: true, data: { total, users, swap, system: { used: `${systemUsedGb}G` } } };

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
