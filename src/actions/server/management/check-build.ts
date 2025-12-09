
'use server';

import { getPrivateServerDetails } from '@/actions/servers';
import { NodeSSH } from 'node-ssh';
import { logErrorToFirestore } from '@/lib/logging';
import { getSite } from '@/actions/editor/site';
import { createServerLog, updateServerLog } from '@/actions/server-logs';
import { runCommand } from '@/actions/runner';
import { resolveAppPath } from './server-paths';
import { updateAppStatus } from './app-status';




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
  const { resolvedPath, error: resolveError, siteId } = await resolveAppPath(serverId);
  if (resolveError || !siteId) {
    return { success: false, error: resolveError || "Could not resolve application path or site ID." };
  }

  // Set status to building
  await updateAppStatus(serverId, {
    applicationBuilt: { status: 'building', recordedAt: new Date().toISOString(), description: 'Building application...' }
  });

  const rebuildCommandTemplate = `
<server.ubuntuBashProcessor>
set -e
echo "--- Starting Rebuild in ${resolvedPath} ---"
cd '${resolvedPath}'

echo "--- Step 1: Deleting existing PM2 process for ${siteId} ---"
(pm2 list | grep -q "${siteId}" && pm2 delete "${siteId}") || echo "No old PM2 process to delete."
pm2 save

echo "--- Step 2: Deleting old Nginx configs for ${siteId} ---"
sudo rm -f /etc/nginx/sites-available/${siteId}.conf
sudo rm -f /etc/nginx/sites-enabled/${siteId}.conf
sudo systemctl reload nginx

echo "--- Step 3: Deleting .next folder ---"
rm -rf .next

echo "--- Step 4: Running npm install ---"
npm install

echo "--- Step 5: Running build ---"
npm run build
echo "--- Rebuild Complete ---"
</server.ubuntuBashProcessor>
    `.trim();

  try {
    const result = await runCommand(serverId, rebuildCommandTemplate, {}, 'Rebuild Application');

    if (result.success && result.finalStatus === 'completed') {
      await updateAppStatus(serverId, {
        applicationBuilt: { status: 'built', recordedAt: new Date().toISOString(), description: 'Build completed successfully.' }
      });
    } else {
      await updateAppStatus(serverId, {
        applicationBuilt: { status: 'notBuilt', recordedAt: new Date().toISOString(), description: 'Build failed.' }
      });
    }

    return { success: result.success, error: result.error, logId: result.logId };
  } catch (error: any) {
    const errorMessage = `Failed to rebuild application for server ${serverId}: ${error.message}`;
    await logErrorToFirestore({
      message: errorMessage,
      stack: error.stack,
      source: 'rebuildApplication',
    });
    await updateAppStatus(serverId, {
      applicationBuilt: { status: 'notBuilt', recordedAt: new Date().toISOString(), description: `Build error: ${error.message}` }
    });
    return { success: false, error: error.message };
  }
}
