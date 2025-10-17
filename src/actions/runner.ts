'use server';

import { createServerLog, updateServerLog } from '@/actions/server-logs';
import { getPrivateServerDetails } from '@/actions/servers';
import { revalidatePath } from 'next/cache';
import { NodeSSH } from 'node-ssh';
import { getFirestore, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { initializeFirebase } from '@/lib/firebase';
import { logErrorToFirestore } from '@/lib/logging';


async function getAllocationUsername(serverId: string): Promise<string | null> {
    const { firestore } = initializeFirebase();
    const allocationsQuery = query(
        collection(firestore, 'serverAllocations'), 
        where('serverId', '==', serverId),
        limit(1)
    );
    const snapshot = await getDocs(allocationsQuery);
    if (snapshot.empty) {
        return null;
    }
    return snapshot.docs[0].data().username || null;
}


export async function runCommand(serverId: string, command: string) {
    if (!command) {
        console.error('Runner Error: No command provided.');
        return;
    }

    const createResult = await createServerLog({
        serverId: serverId,
        command: command,
        output: `Initiating command...`,
        status: 'pending',
        initiatedBy: 'system', // Added missing initiatedBy
    });

    if (!createResult.success || !createResult.id) {
        console.error('Failed to create log entry for command:', command, 'Error:', createResult.error);
        return;
    }
    const logId = createResult.id;
    
    revalidatePath(`/root/servers/${serverId}`);

    const ssh = new NodeSSH();
    let finalOutput = ''; 

    try {
        const { server, error: serverError } = await getPrivateServerDetails(serverId);

        if (serverError || !server || !server.publicIp || !server.privateKey) {
            finalOutput = `Failed to retrieve server credentials: ${serverError || 'Missing IP or private key.'}`;
            await updateServerLog(logId, {
                status: 'failed',
                output: finalOutput,
                completedAt: new Date().toISOString(),
            });
            revalidatePath(`/root/servers/${serverId}`);
            return;
        }

        // For root commands, we need a username. We will try to get it from an allocation.
        // This logic assumes one allocation per server for simplicity.
        const username = await getAllocationUsername(serverId);
        if (!username) {
            logErrorToFirestore({
                message: `Could not find an allocation username for server ${serverId}. Defaulting to 'root'.`,
                source: 'runCommand',
                details: 'This is a fallback. A username should be specified in the server allocation.'
            });
        }

        await updateServerLog(logId, { status: 'ongoing', output: `Connecting to ${server.publicIp}...` });
        revalidatePath(`/root/servers/${serverId}`);

        await ssh.connect({
            host: server.publicIp,
            username: username || 'root', // Fallback to root, with an error logged.
            privateKey: server.privateKey
        });

        await updateServerLog(logId, { output: `Connection successful as '${username || 'root'}'. Running command...

$ ${command}` });
        revalidatePath(`/root/servers/${serverId}`);

        const result = await ssh.execCommand(command);
        
        if (result.stdout) {
            finalOutput += `STDOUT:
${result.stdout}

`;
        }
        if (result.stderr) {
            finalOutput += `STDERR:
${result.stderr}

`;
        }
        finalOutput += `Exited with code: ${result.code}`;

        await updateServerLog(logId, {
            status: result.code === 0 ? 'completed' : 'failed',
            output: finalOutput,
            completedAt: new Date().toISOString(), 
        });

    } catch (error: any) {
        finalOutput = `An unexpected error occurred: ${error.message || String(error)}`; 
        if (error.message.includes('All configured authentication methods failed')) {
            finalOutput = `SSH Authentication Failed. Please check server credentials and username. Error: ${error.message}`;
        } else if (error.message.includes('Connection timed out')) {
            finalOutput = `SSH Connection Timed Out. Server might be unreachable or IP is incorrect. Error: ${error.message}`;
        }

        await updateServerLog(logId, {
            status: 'failed',
            output: `Error during command execution: ${finalOutput}`,
            completedAt: new Date().toISOString(),
        });
        console.error(`Runner Error for server ${serverId}, log ${logId}:`, error); 
    } finally {
        if(ssh.isConnected()) {
            ssh.dispose();
        }
        revalidatePath(`/root/servers/${serverId}`);
    }
}