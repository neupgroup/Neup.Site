
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
}

function parseLsOutput(output: string, currentPath: string): FileInfo[] {
  const lines = output.trim().split('\n').slice(1); // Skip "total" line
  const files: FileInfo[] = [];

  for (const line of lines) {
    const parts = line.split(/\s+/);
    if (parts.length < 9) continue;

    const [permissions, , owner, group, size, month, day, timeOrYear] = parts;
    
    // The file name can contain spaces, so we need to rejoin the end parts.
    // The "name" is what we will check for links.
    let nameIndex = 8;
    // In `ls -la`, if there's a symlink, "->" appears. The part before it is the filename.
    const linkArrowIndex = parts.findIndex(p => p === '->');
    if (linkArrowIndex > -1) {
        nameIndex = linkArrowIndex -1;
    }
    const name = parts[nameIndex];
    
    // Filter out '.' and '..' entries
    if (name === '.' || name === '..') {
        continue;
    }

    // Simple check for file type from permissions string
    const type = permissions.startsWith('d') ? 'd' : permissions.startsWith('l') ? 'l' : '-';

    files.push({
      type,
      name,
      permissions,
      owner,
      group,
      size,
      modified: `${month} ${day} ${timeOrYear}`,
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
    
    // Sanitize path to prevent command injection
    const sanitizedPath = path.replace(/"/g, '\\"').replace(/`/g, '\\`').replace(/\$/g, '\\$');

    const result = await ssh.execCommand(`ls -la "${sanitizedPath}"`);

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
