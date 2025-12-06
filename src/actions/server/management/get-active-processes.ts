
'use server';

import { getPrivateServerDetails } from '@/actions/servers';
import { NodeSSH } from 'node-ssh';
import { logErrorToFirestore } from '@/lib/logging';

export interface ProcessInfo {
  user: string;
  pid: number;
  cpu: string;
  mem: number; // Changed to number to store MB
  vsz: string;
  rss: string;
  tty: string;
  stat: string;
  start: string;
  time: string;
  command: string;
}

function parsePsOutput(output: string): ProcessInfo[] {
  const lines = output.trim().split('\n');
  const processes: ProcessInfo[] = [];

  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 11) continue;

    const user = parts[0];
    const pid = parseInt(parts[1], 10);
    const cpu = parts[2];
    const rssInKb = parseInt(parts[5], 10); // RSS is column 6
    const memInMb = !isNaN(rssInKb) ? rssInKb / 1024 : 0;

    const vsz = parts[4];
    const rss = parts[5];
    const tty = parts[6];
    const stat = parts[7];
    const start = parts[8];
    const time = parts[9];
    const command = parts.slice(10).join(' ');

    if (!isNaN(pid)) {
      processes.push({ user, pid, cpu, mem: memInMb, vsz, rss, tty, stat, start, time, command });
    }
  }
  
  return processes;
}


export async function getActiveProcesses(serverId: string): Promise<{ success: boolean; processes?: ProcessInfo[]; error?: string }> {
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

    // Use --sort=-rss to sort by memory usage descending
    const result = await ssh.execCommand("ps aux --no-headers --sort=-rss");
    if (result.code !== 0) {
      throw new Error(`Command failed: ${result.stderr}`);
    }
    
    const processes = parsePsOutput(result.stdout);

    return { success: true, processes };

  } catch (error: any) {
    await logErrorToFirestore({
      message: `Failed to get active processes for server ${serverId}: ${error.message}`,
      stack: error.stack,
      source: 'getActiveProcesses',
    });
    return { success: false, error: error.message };
  } finally {
    if (ssh.isConnected()) {
      ssh.dispose();
    }
  }
}
