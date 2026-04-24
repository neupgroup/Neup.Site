
'use server';

import { getPrivateServerDetails } from '@/actions/servers';
import { NodeSSH } from 'node-ssh';
import { logErrorToDatabase } from '@/lib/logging';

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
    const files: FileInfo[] = [];
    const lines = output.trim().split('\n');

    for (const line of lines) {
        // Example line: -rw-r--r-- 1 root root 4096 2024-07-31 10:00:00.000000000 +0000 my-file.txt
        // Symlink: lrwxrwxrwx 1 root root 23 2024-07-31 10:00:00.000000000 +0000 htdocs -> /opt/bitnami/apache/htdocs
        const parts = line.match(/^([dl-])([rwx-]{9})\s+\d+\s+([\w-]+)\s+([\w-]+)\s+([\w\d\.]+)\s+([\d-]{10}\s[\d:]{8}\.[\d]+)\s[+\d-]+\s+(.*)$/);

        if (!parts) continue;

        const [, type, permissions, owner, group, size, modified, namePart] = parts;
        
        let name = namePart;
        let targetPath: string | undefined;

        if (type === 'l') {
            const linkParts = namePart.split(' -> ');
            name = linkParts[0];
            targetPath = linkParts[1];
        }

        if (name === '.' || name === '..') {
            continue;
        }

        files.push({
            type: type as any,
            name,
            permissions,
            owner,
            group,
            size,
            modified,
            targetPath,
        });
    }

    return files.sort((a, b) => {
        if (a.type === 'd' && b.type !== 'd') return -1;
        if (a.type !== 'd' && b.type === 'd') return 1;
        return a.name.localeCompare(b.name);
    });
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
    
    // Sanitize path for shell command by wrapping in single quotes
    const sanitizedPath = `'${path.replace(/'/g, "'\\''")}'`;

    // This command is more complex. It gets a detailed list, then iterates through directories
    // to get their total size with `du -sh`.
    const command = `
        cd ${sanitizedPath}
        ls -la --full-time | awk 'NR>1 {print}' | while read line; do
            type=$(echo "$line" | cut -c1)
            if [ "$type" = "d" ]; then
                dir_name=$(echo "$line" | awk '{print $NF}')
                if [ "$dir_name" != "." ] && [ "$dir_name" != ".." ]; then
                    size=$(du -sh "$dir_name" 2>/dev/null | awk '{print $1}')
                    # Replace original size with du size
                    echo "$line" | awk -v size="$size" '{$5=size; print}'
                else
                    echo "$line"
                fi
            else
                echo "$line"
            fi
        done
    `;

    const result = await ssh.execCommand(command);

    if (result.code !== 0) {
      // Fallback to simpler command if the complex one fails (e.g., due to permissions)
      const fallbackResult = await ssh.execCommand(`ls -la --full-time ${sanitizedPath}`);
      if (fallbackResult.code !== 0) {
        throw new Error(`Command failed: ${fallbackResult.stderr}`);
      }
      const files = parseLsOutput(fallbackResult.stdout, path);
      return { success: true, files };
    }
    
    const files = parseLsOutput(result.stdout, path);
    return { success: true, files };

  } catch (error: any) {
    await logErrorToDatabase({
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
