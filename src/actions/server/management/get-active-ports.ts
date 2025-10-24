
'use server';

import { getPrivateServerDetails } from '@/actions/servers';
import { NodeSSH } from 'node-ssh';
import { logErrorToFirestore } from '@/lib/logging';

export interface ActivePortInfo {
  protocol: 'TCP' | 'UDP';
  port: number;
  address: string;
  process?: string;
}

function parseSsOutput(output: string): ActivePortInfo[] {
  const lines = output.trim().split('\n').slice(1); // Skip header
  const ports: ActivePortInfo[] = [];
  const seenPorts = new Set<string>();

  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 5) continue;

    const protocol = parts[0].toUpperCase().startsWith('UDP') ? 'UDP' : 'TCP';
    const localAddressPort = parts[4];
    
    // Updated regex to handle various address formats and extract port
    const addressMatch = localAddressPort.match(/(?:[\[\w\:\.\]]+):(\d+)$/);
    if (!addressMatch) continue;

    const port = parseInt(addressMatch[1], 10);
    const address = localAddressPort.substring(0, localAddressPort.lastIndexOf(':'));
    
    const portKey = `${port}/${protocol}`;
    if (seenPorts.has(portKey)) continue;

    let processInfo: string | undefined;
    if (parts.length > 5) {
        const processMatch = line.match(/users:\(\("([^"]+)"/);
        if (processMatch && processMatch[1]) {
            processInfo = processMatch[1];
        }
    }

    ports.push({ protocol, port, address, process: processInfo });
    seenPorts.add(portKey);
  }
  
  return ports.sort((a, b) => a.port - b.port);
}


export async function getActivePorts(serverId: string): Promise<{ success: boolean; ports?: ActivePortInfo[]; error?: string }> {
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

    const result = await ssh.execCommand("ss -tunp");
    if (result.code !== 0) {
      throw new Error(`Command failed: ${result.stderr}`);
    }
    
    const ports = parseSsOutput(result.stdout);

    return { success: true, ports };

  } catch (error: any) {
    await logErrorToFirestore({
      message: `Failed to get active ports for server ${serverId}: ${error.message}`,
      stack: error.stack,
      source: 'getActivePorts',
    });
    return { success: false, error: error.message };
  } finally {
    if (ssh.isConnected()) {
      ssh.dispose();
    }
  }
}

