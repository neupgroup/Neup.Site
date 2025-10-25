
'use server';

import { getPrivateServerDetails } from '@/actions/servers';
import { NodeSSH } from 'node-ssh';
import { logErrorToFirestore } from '@/lib/logging';

export interface FileInfo {
  type: 'd' | '-' | 'l'; // directory, file, link
  name: string;
  permissions: string;
  owner: string;
  group: string;
  size: string;
  modified: string;
  fullPath?: string;
  targetPath?: string; // The path a symlink points to
}

function parseLsOutput(output: string, currentPath: string): FileInfo[] {
  const lines = output.trim().split('\n').slice(1); // Skip "total" line
  const files: FileInfo[] = [];

  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 9) continue;

    const [permissions, , owner, group, size, date, time] = parts;
    const nameIndex = 8;
    const name = parts[nameIndex];

    if (name === '.' || name === '..') {
      continue;
    }
    
    const type = permissions.startsWith('d') ? 'd' : permissions.startsWith('l') ? 'l' : '-';
    
    let targetPath: string | undefined;
    // If it's a symlink, the target path is after '->'
    const linkArrowIndex = parts.indexOf('->');
    if (type === 'l' && linkArrowIndex > -1 && parts[linkArrowIndex + 1]) {
      targetPath = parts.slice(linkArrowIndex + 1).join(' ');
    }

    files.push({
      type,
      name,
      permissions,
      owner,
      group,
      size,
      modified: `${date} ${time}`,
      targetPath,
    });
  }

  return files;
}

export async function getFileList(serverId: string, path: string = '/'): Promise<{ success: boolean; files?: FileInfo[]; error?: string }> {
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
    
    const sanitizedPath = path.replace(/"/g, '\\"').replace(/`/g, '\\`').replace(/\$/g, '\\$');

    // Using --full-time gives a consistent date format, avoiding locale issues.
    const result = await ssh.execCommand(`ls -la --full-time "${sanitizedPath}"`);

    if (result.code !== 0) {
      throw new Error(`Command failed: ${result.stderr}`);
    }
    
    const files = parseLsOutput(result.stdout, path);
    return { success: true, files };

  } catch (error: any) {
    await logErrorToFirestore({
      message: `Failed to get file list for server ${serverId} at path ${path}: ${error.message}`,
      stack: error.stack,
      source: 'getFileList',
    });
    return { success: false, error: error.message };
  } finally {
    if (ssh.isConnected()) {
      ssh.dispose();
    }
  }
}
