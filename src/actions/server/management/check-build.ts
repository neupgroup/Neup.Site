
'use server';

import { getPrivateServerDetails } from '@/actions/servers';
import { NodeSSH } from 'node-ssh';
import { logErrorToDatabase } from '@/lib/logging';
import { getArtifact } from '@/actions/editor/artifact';
import { createServerLog, updateServerLog } from '@/actions/server-logs';
import { runCommand } from '@/actions/runner';
import { resolveAppPath } from './server-paths';
import { updateAppStatus } from './app-status';




export async function checkPathExists(serverId: string, path?: string, isProduction: boolean = true): Promise<{ exists: boolean; error?: string, resolvedPath?: string }> {
  const ssh = new NodeSSH();
  let pathToCheck = path;
  let resolvedPathForOutput = path;

  try {
    const { server, error: serverError } = await getPrivateServerDetails(serverId);
    if (serverError || !server) {
      throw new Error(`Failed to retrieve server credentials: ${serverError}`);
    }

    if (!pathToCheck) {
      const { resolvedPath, error: resolveError } = await resolveAppPath(serverId, isProduction);
      if (resolveError) {
        throw new Error(resolveError);
      }
      pathToCheck = resolvedPath;
    }

    // Resolve {{universal.site_id}} / {{universal.artifact_id}} if present in the path
    if (pathToCheck.includes('{{universal.site_id}}') || pathToCheck.includes('{{universal.artifact_id}}')) {
      const { artifact } = await getArtifact();
      if (artifact) {
        pathToCheck = pathToCheck
          .replace(/\{\{universal.site_id\}\}/g, artifact.id)
          .replace(/\{\{universal.artifact_id\}\}/g, artifact.id);
      } else {
        throw new Error('Could not resolve universal artifact ID because artifact context is not available.');
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
    await logErrorToDatabase({
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

export async function rebuildApplication(serverId: string, isProduction: boolean = true): Promise<{ success: boolean; error?: string, logId?: string }> {
  const { resolvedPath, error: resolveError, artifactId } = await resolveAppPath(serverId, isProduction);
  if (resolveError || !artifactId) {
    return { success: false, error: resolveError || "Could not resolve application path or artifact ID." };
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

echo "--- Step 1: Deleting existing PM2 process for ${artifactId}${isProduction ? '' : '.development'} ---"
(pm2 list | grep -q "${artifactId}${isProduction ? '' : '.development'}" && pm2 delete "${artifactId}${isProduction ? '' : '.development'}") || echo "No old PM2 process to delete."
pm2 save

echo "--- Step 2: Deleting old Nginx configs for ${artifactId}${isProduction ? '' : '.development'} ---"
sudo rm -f /etc/nginx/sites-available/${artifactId}${isProduction ? '' : '.development'}.conf
sudo rm -f /etc/nginx/sites-enabled/${artifactId}${isProduction ? '' : '.development'}.conf
sudo systemctl reload nginx

echo "--- Step 3: Deleting .next and node_modules folders ---"
rm -rf .next node_modules

echo "--- Step 4: Running npm install ---"
npm install

echo "--- Step 5: Running build ---"
NODE_OPTIONS="--max_old_space_size=4096" npm run build
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
    await logErrorToDatabase({
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
