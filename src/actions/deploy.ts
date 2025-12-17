
'use server';

import { cookies } from 'next/headers';
import { getFirestore, collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { getStorage, ref, listAll, getDownloadURL } from 'firebase/storage';
import { initializeFirebase } from '@/lib/firebase';
import { getPrivateServerDetails } from '@/actions/servers';
import { createServerLog, updateServerLog } from '@/actions/server-logs';
import { NodeSSH } from 'node-ssh';
import { logErrorToFirestore } from '@/lib/logging';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { getSite } from './editor/site';

async function downloadFile(url: string, dest: string): Promise<void> {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Failed to download file from ${url}: ${res.statusText}`);
    }
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(dest, buffer);
}

export async function deployCodebase(): Promise<{ success: boolean; error?: string; serverId?: string; logId?: string; }> {
    const cookieStore = await cookies();
    const siteId = cookieStore.get('siteId')?.value;
    if (!siteId) return { success: false, error: 'Site ID not found.' };

    const { firestore } = initializeFirebase();

    // 1. Find the server allocation for this site
    const allocationsQuery = query(
        collection(firestore, 'allocations'),
        where('siteId', '==', siteId),
        limit(1)
    );
    const allocationsSnapshot = await getDocs(allocationsQuery);
    if (allocationsSnapshot.empty) {
        return { success: false, error: 'No server allocated to this site.' };
    }
    const allocation = allocationsSnapshot.docs[0].data();
    const serverId = allocation.serverId;

    // 2. Get server credentials
    const { server, error: serverError } = await getPrivateServerDetails(serverId);
    if (serverError || !server || !server.publicIp || !server.privateKey) {
        return { success: false, error: `Failed to retrieve server credentials: ${serverError || 'Missing IP or key.'}` };
    }

    const { site } = await getSite();
    if (!site) {
      return { success: false, error: 'Could not resolve site context for deployment.' };
    }

    const resolvedAppPath = server.appPath?.replace(/\{\{\s*universal\.site_id\s*\}\}/g, site.id) || `/var/www/${site.id}`;

    // 3. Create initial log entry
    const createLogResult = await createServerLog({
        serverId: serverId,
        commandName: `Asset Deployment for site: ${siteId}`,
        command: `Deploying assets from Firebase Storage to ${resolvedAppPath}/public`,
        output: 'Starting asset deployment...',
        status: 'pending',
        initiatedBy: 'system',
    });

    if (!createLogResult.success || !createLogResult.id) {
        return { success: false, error: `Failed to create log entry: ${createLogResult.error}` };
    }
    const logId = createLogResult.id;

    // Start the deployment in the background (don't await the full process)
    runAssetDeploymentInBackground(logId, serverId, siteId, resolvedAppPath, server.username || 'root', server.publicIp, server.privateKey);

    return { success: true, serverId, logId };
}


async function runAssetDeploymentInBackground(logId: string, serverId: string, siteId: string, appPath: string, username: string, host: string, privateKey: string) {
    const { storage } = initializeFirebase();
    const ssh = new NodeSSH();
    let finalOutput = `Starting asset deployment for site ${siteId}...\n`;

    try {
        await updateServerLog(logId, { status: 'ongoing', output: finalOutput });

        const storageRef = ref(storage, `uploads/${siteId}`);
        const res = await listAll(storageRef);

        if (res.items.length === 0 && res.prefixes.length === 0) {
            finalOutput += 'No assets found in Firebase Storage to deploy.\n';
            await updateServerLog(logId, { status: 'completed', output: finalOutput });
            return;
        }

        finalOutput += `Found ${res.items.length} file(s) and ${res.prefixes.length} folder(s).\nConnecting to server...\n`;
        await updateServerLog(logId, { output: finalOutput });

        await ssh.connect({ host, username, privateKey });

        finalOutput += 'Connected to server. Preparing public directory...\n';
        await updateServerLog(logId, { output: finalOutput });
        const remotePublicPath = `${appPath}/public`;
        await ssh.execCommand(`mkdir -p ${remotePublicPath}`);

        for (const itemRef of res.items) {
            const downloadUrl = await getDownloadURL(itemRef);
            const tempFilePath = path.join(os.tmpdir(), itemRef.name);
            const remotePath = path.posix.join(remotePublicPath, itemRef.name);

            finalOutput += `Downloading ${itemRef.name}...\n`;
            await updateServerLog(logId, { output: finalOutput });
            
            await downloadFile(downloadUrl, tempFilePath);

            finalOutput += `Uploading ${itemRef.name} to ${remotePath}...\n`;
            await updateServerLog(logId, { output: finalOutput });

            await ssh.putFile(tempFilePath, remotePath);
            await fs.unlink(tempFilePath);
        }

        finalOutput += `\nAsset deployment completed successfully.`;
        await updateServerLog(logId, { status: 'completed', output: finalOutput });

    } catch (e: any) {
        finalOutput += `\n\n--- DEPLOYMENT FAILED ---\n${e.message}`;
        await updateServerLog(logId, { status: 'failed', output: finalOutput });
        await logErrorToFirestore({
            message: `Asset deployment failed for site ${siteId}: ${e.message}`,
            source: 'deployCodebase.runAssetDeploymentInBackground',
            stack: e.stack,
        });
    } finally {
        if (ssh.isConnected()) {
            ssh.dispose();
        }
    }
}
