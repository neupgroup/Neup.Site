
'use server';

import { getPrivateServerDetails } from '@/actions/servers';
import { NodeSSH } from 'node-ssh';
import { logErrorToFirestore } from '@/lib/logging';

export interface ProcessManagerInfo {
  name: string;
  id: number;
  pid: number;
  status: string;
  cpu: number;
  memory: string; // e.g., "155.2 MB"
  uptime: string;
  restarts: number;
}

function parsePm2List(output: string): ProcessManagerInfo[] {
  try {
    const processes = JSON.parse(output);
    if (!Array.isArray(processes)) return [];

    return processes.map(proc => {
        const uptimeInSeconds = (Date.now() - (proc.pm2_env?.pm_uptime || Date.now())) / 1000;
        let uptimeString = '';
        if (uptimeInSeconds > 86400) {
            uptimeString = `${Math.floor(uptimeInSeconds / 86400)}d`;
        } else if (uptimeInSeconds > 3600) {
            uptimeString = `${Math.floor(uptimeInSeconds / 3600)}h`;
        } else {
            uptimeString = `${Math.floor(uptimeInSeconds / 60)}m`;
        }

        return {
            name: proc.name,
            id: proc.pm_id,
            pid: proc.pid,
            status: proc.pm2_env?.status || 'N/A',
            cpu: proc.monit?.cpu || 0,
            memory: proc.monit?.memory ? `${(proc.monit.memory / (1024 * 1024)).toFixed(1)} MB` : '0 MB',
            uptime: uptimeString,
            restarts: proc.pm2_env?.restart_time || 0,
        }
    });

  } catch (e) {
    console.error("Failed to parse PM2 JSON output:", e);
    // If JSON parsing fails, try to handle plain text output from `pm2 list` as a fallback.
    // This is a simplified parser and may not be robust.
    const lines = output.trim().split('\n').slice(3, -1);
    const processes: ProcessManagerInfo[] = [];

    for (const line of lines) {
        // Regex to handle potential color codes and split the line
        const parts = line.replace(/\u001b\[\d+m/g, '').split(/\s*│\s*/).map(p => p.trim());
        if (parts.length > 8) {
            processes.push({
                id: parseInt(parts[1], 10),
                name: parts[2],
                pid: parseInt(parts[6], 10),
                status: parts[8],
                cpu: parseFloat(parts[10]),
                memory: parts[11],
                uptime: parts[9],
                restarts: parseInt(parts[12], 10) || 0,
            });
        }
    }
    return processes;
  }
}

export async function getPm2Processes(serverId: string): Promise<{ success: boolean; processes?: ProcessManagerInfo[]; error?: string }> {
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
    
    // First, check if pm2 is installed
    const checkResult = await ssh.execCommand("command -v pm2");
    if (checkResult.code !== 0) {
        return { success: true, processes: [] }; // PM2 not installed, return empty list.
    }

    const result = await ssh.execCommand("pm2 jlist");
    if (result.code !== 0) {
        // Fallback to `pm2 list` if `jlist` fails for some reason
        const listResult = await ssh.execCommand("pm2 list");
        if (listResult.code !== 0) {
            throw new Error(`Command failed: ${listResult.stderr}`);
        }
        const processes = parsePm2List(listResult.stdout);
        return { success: true, processes };
    }
    
    const processes = parsePm2List(result.stdout);

    return { success: true, processes };

  } catch (error: any) {
    await logErrorToFirestore({
      message: `Failed to get PM2 processes for server ${serverId}: ${error.message}`,
      stack: error.stack,
      source: 'getPm2Processes',
    });
    return { success: false, error: error.message };
  } finally {
    if (ssh.isConnected()) {
      ssh.dispose();
    }
  }
}

export async function managePm2Process(
    serverId: string,
    action: 'delete' | 'save',
    processId?: number | string
): Promise<{ success: boolean, error?: string }> {
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

    let command = '';
    if (action === 'delete') {
      if (!processId && processId !== 0) throw new Error('Process ID is required for delete action.');
      command = `pm2 delete ${processId}`;
    } else if (action === 'save') {
      command = `pm2 save`;
    } else {
      throw new Error('Invalid PM2 action.');
    }
    
    const result = await ssh.execCommand(command);

    if (result.code !== 0) {
      throw new Error(result.stderr || `PM2 command "${action}" failed.`);
    }

    return { success: true };

  } catch (error: any) {
    await logErrorToFirestore({
      message: `Failed to ${action} PM2 process on server ${serverId}: ${error.message}`,
      stack: error.stack,
      source: 'managePm2Process',
    });
    return { success: false, error: error.message };
  } finally {
    if (ssh.isConnected()) {
      ssh.dispose();
    }
  }
}
