
'use server';

import { cookies } from 'next/headers';
import { getFirestore, collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { initializeFirebase } from '@/lib/firebase';
import { getPrivateServerDetails } from '@/actions/servers';
import { createServerLog, updateServerLog } from '@/actions/server-logs';
import { NodeSSH } from 'node-ssh';
import { logErrorToFirestore } from '@/lib/logging';
import type { CodeFile } from '@/schemas/codebase';

async function getAllFiles(siteId: string): Promise<CodeFile[]> {
    const { firestore } = initializeFirebase();
    const filesRef = collection(firestore, 'codeFiles');
    const siteQuery = query(filesRef, where('siteId', '==', siteId));
    const querySnapshot = await getDocs(siteQuery);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CodeFile));
}

export async function deployCodebase(): Promise<{ success: boolean; error?: string; serverId?: string; logId?: string; }> {
    const cookieStore = cookies();
    const siteId = cookieStore.get('siteId')?.value;
    if (!siteId) return { success: false, error: 'Site ID not found.' };

    const { firestore } = initializeFirebase();

    // 1. Find the server allocation for this site
    const allocationsQuery = query(
        collection(firestore, 'serverAllocations'),
        where('siteId', '==', siteId),
        limit(1)
    );
    const allocationsSnapshot = await getDocs(allocationsQuery);
    if (allocationsSnapshot.empty) {
        return { success: false, error: 'No server allocated to this site.' };
    }
    const allocation = allocationsSnapshot.docs[0].data();
    const serverId = allocation.serverId;
    
    const deploymentPath = allocation.deploymentPath || '/var/www/app';

    // 2. Get server credentials
    const { server, error: serverError } = await getPrivateServerDetails(serverId);
    if (serverError || !server || !server.publicIp || !server.privateKey) {
        return { success: false, error: `Failed to retrieve server credentials: ${serverError || 'Missing IP or key.'}` };
    }

    const username = allocation.username || server.username || 'root';

    // 3. Create initial log entry
    const createLogResult = await createServerLog({
        serverId: serverId,
        command: `CODEBASE DEPLOYMENT for site: ${siteId}`,
        output: 'Starting deployment...',
        status: 'pending',
    });

    if (!createLogResult.success || !createLogResult.id) {
        return { success: false, error: `Failed to create log entry: ${createLogResult.error}` };
    }
    const logId = createLogResult.id;

    // Start the deployment in the background (don't await the full process)
    runDeploymentInBackground(logId, serverId, siteId, deploymentPath, username, server.publicIp, server.privateKey);

    return { success: true, serverId, logId };
}


async function runDeploymentInBackground(logId: string, serverId: string, siteId: string, deploymentPath: string, username: string, host: string, privateKey: string) {
    const ssh = new NodeSSH();
    let finalOutput = '';

    try {
        await updateServerLog(logId, { status: 'ongoing', output: `Fetching all code files for site ${siteId}...` });

        const files = await getAllFiles(siteId);
        if (files.length === 0) {
            throw new Error("No files found in the codebase to deploy.");
        }

        await updateServerLog(logId, { output: `Found ${files.length} files. Connecting to server ${host}...` });

        await ssh.connect({ host, username, privateKey });

        await updateServerLog(logId, { output: `Connected to server. Preparing remote directory: ${deploymentPath}` });

        await ssh.execCommand(`mkdir -p ${deploymentPath}`);

        finalOutput += `Connected successfully.\nUploading ${files.length} files to ${deploymentPath}...\n\n`;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const remotePath = `${deploymentPath}/${file.filePath}`;
            const remoteDir = remotePath.substring(0, remotePath.lastIndexOf('/'));
            
            // This is slow if done for every file. A better approach would be to collect all dirs first.
            if (remoteDir !== deploymentPath) {
                await ssh.execCommand(`mkdir -p ${remoteDir}`);
            }

            // The content is already base64 encoded in the database
            const fileContent = Buffer.from(file.content, 'base64');
            await ssh.putFile(fileContent, remotePath);

            const progress = `(${(i + 1)}/${files.length}) Uploaded: ${file.filePath}\n`;
            finalOutput += progress;
            
            // Only update log periodically to avoid spamming Firestore
            if (i % 5 === 0 || i === files.length - 1) {
                await updateServerLog(logId, { output: finalOutput });
            }
        }

        finalOutput += `\nDeployment completed successfully.`;
        await updateServerLog(logId, { status: 'completed', output: finalOutput });

    } catch (e: any) {
        finalOutput += `\n\n--- DEPLOYMENT FAILED ---\n${e.message}`;
        await updateServerLog(logId, { status: 'failed', output: finalOutput });
        await logErrorToFirestore({
            message: `Deployment failed for site ${siteId}: ${e.message}`,
            source: 'deployCodebase.runDeploymentInBackground',
            stack: e.stack,
        });
    } finally {
        if (ssh.isConnected()) {
            ssh.dispose();
        }
    }
}
