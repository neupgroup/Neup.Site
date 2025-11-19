
'use server';

import { getPrivateServerDetails } from '@/actions/servers';
import { NodeSSH } from 'node-ssh';
import { logErrorToFirestore } from '@/lib/logging';
import { getSite } from '@/actions/editor/site';
import { createServerLog, updateServerLog } from '@/actions/server-logs';

async function resolveAppPath(serverId: string): Promise<{ resolvedPath: string, error?: string, siteId?: string }> {
    const { server, error: serverError } = await getPrivateServerDetails(serverId);
    if (serverError || !server) {
        return { resolvedPath: '', error: 'Could not retrieve server details for path resolution.' };
    }

    const { site, error: siteError } = await getSite();
    if (siteError || !site) {
        return { resolvedPath: '', error: 'Could not retrieve site details for path resolution.' };
    }

    let resolvedPath = server.appPath || `/var/www/{{universal.site_id}}`;

    const variables: Record<string, string> = {
        '{{universal.site_id}}': site.id,
        '{{server.username}}': server.username || 'root',
    };

    for (const [key, value] of Object.entries(variables)) {
        resolvedPath = resolvedPath.replace(new RegExp(key.replace(/\{|\}/g, '\\$&'), 'g'), value);
    }
    
    return { resolvedPath, siteId: site.id };
}


export async function checkPathExists(serverId: string, path?: string): Promise<{ exists: boolean; error?: string, resolvedPath?: string }> {
  const ssh = new NodeSSH();
  let pathToCheck = path;
  let resolvedPathForOutput = path;

  try {
    const { server, error: serverError } = await getPrivateServerDetails(serverId);
    if (serverError || !server) {
      throw new Error(`Failed to retrieve server credentials: ${serverError}`);
    }
    
    if (!pathToCheck) {
        const { resolvedPath, error: resolveError } = await resolveAppPath(serverId);
        if (resolveError) {
            throw new Error(resolveError);
        }
        pathToCheck = resolvedPath;
    }

    // Resolve {{universal.site_id}} if it exists in the path
    if (pathToCheck.includes('{{universal.site_id}}')) {
        const { site } = await getSite();
        if (site) {
            pathToCheck = pathToCheck.replace(/\{\{universal.site_id\}\}/g, site.id);
        } else {
            throw new Error('Could not resolve {{universal.site_id}} because site context is not available.');
        }
    }
    resolvedPathForOutput = pathToCheck;


    await ssh.connect({
      host: server.publicIp,
      username: server.username || 'root',
      privateKey: server.privateKey,
    });

    const result = await ssh.execCommand(`test -e '${pathToCheck}'`);
    
    return { exists: result.code === 0, resolvedPath: resolvedPathForOutput };

  } catch (error: any) {
    await logErrorToFirestore({
      message: `Failed to check path existence for server ${serverId} at path ${pathToCheck}: ${error.message}`,
      stack: error.stack,
      source: 'checkPathExists',
    });
    return { exists: false, error: error.message, resolvedPath: resolvedPathForOutput };
  } finally {
    if (ssh.isConnected()) {
      ssh.dispose();
    }
  }
}

export async function rebuildApplication(serverId: string): Promise<{ success: boolean; error?: string, logId?: string }> {
    const ssh = new NodeSSH();
    let appPath = '';
    let siteId = '';

    const { resolvedPath, error: resolveError, siteId: resolvedSiteId } = await resolveAppPath(serverId);
    if (resolveError) {
        return { success: false, error: resolveError };
    }
    appPath = resolvedPath;
    siteId = resolvedSiteId || '';


    // Define the command script first
    const rebuildCommandScript = (path: string, siteIdentifier: string) => `
set -e
SWAP_FILE="/swapfile_rebuild"
cleanup() {
    if [ -f "$SWAP_FILE" ]; then
        echo "--- Removing temporary swap file ---"
        sudo swapoff "$SWAP_FILE"
        sudo rm -f "$SWAP_FILE"
    fi
}
trap cleanup EXIT

echo "--- Creating 4GB temporary swap file ---"
sudo fallocate -l 4G "$SWAP_FILE"
sudo chmod 600 "$SWAP_FILE"
sudo mkswap "$SWAP_FILE"
sudo swapon "$SWAP_FILE"
echo "--- Swap file created ---"

echo "--- Starting Rebuild in ${path} ---"
cd '${path}'

echo "--- Step 1: Deleting existing PM2 process for ${siteIdentifier} ---"
(pm2 list | grep -q "${siteIdentifier}" && pm2 delete "${siteIdentifier}") || echo "No old PM2 process to delete."
pm2 save

echo "--- Step 2: Deleting old Nginx configs for ${siteIdentifier} ---"
sudo rm -f /etc/nginx/sites-available/${siteIdentifier}.conf
sudo rm -f /etc/nginx/sites-enabled/${siteIdentifier}.conf
sudo systemctl reload nginx

echo "--- Step 3: Deleting .next folder ---"
rm -rf .next

echo "--- Step 4: Running npm install ---"
npm install

echo "--- Step 5: Running build ---"
npm run build
echo "--- Rebuild Complete ---"
    `.trim();

    try {
        const command = rebuildCommandScript(appPath, siteId);

        const createLogResult = await createServerLog({ 
            serverId, 
            commandName: 'Rebuild Application',
            command: command, 
            output: 'Starting rebuild...', 
            status: 'pending' 
        });

        const logId = createLogResult.id;

        if (!logId) {
            return { success: false, error: 'Failed to create log entry.' };
        }

        const { server, error: serverError } = await getPrivateServerDetails(serverId);
        if (serverError || !server) {
            throw new Error(`Failed to retrieve server credentials: ${serverError}`);
        }
        
        await updateServerLog(logId, { output: `Connecting to server...` });
        await ssh.connect({
            host: server.publicIp,
            username: server.username || 'root',
            privateKey: server.privateKey,
        });
        
        await updateServerLog(logId, { status: 'ongoing', output: `Executing rebuild command in ${appPath}...` });
        const result = await ssh.execCommand(command);
        const finalOutput = result.stdout + (result.stderr ? `\nSTDERR:\n${result.stderr}` : '');

        if (result.code !== 0) {
            throw new Error(`Rebuild failed: ${finalOutput}`);
        }
        
        await updateServerLog(logId, { status: 'completed', output: finalOutput });
        return { success: true, logId };

    } catch (error: any) {
        const errorMessage = `Failed to rebuild application for server ${serverId} at path ${appPath}: ${error.message}`;
        await logErrorToFirestore({
            message: errorMessage,
            stack: error.stack,
            source: 'rebuildApplication',
        });
        // We can't assume logId exists here if initial createServerLog failed.
        // The runner.ts example showed a similar issue.
        // It's safer to just return the error.
        return { success: false, error: error.message };
    } finally {
        if (ssh.isConnected()) {
          ssh.dispose();
        }
    }
}
