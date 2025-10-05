
'use server';

import { createServerLog, updateServerLog } from '@/actions/server-logs';
import { getPrivateServerDetails } from '@/actions/servers';
import { revalidatePath } from 'next/cache';
import { NodeSSH } from 'node-ssh';
import { initializeFirebase } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';


async function getAllocationUsername(serverId: string): Promise<string> {
    try {
        const { firestore } = initializeFirebase();
        const q = query(
            collection(firestore, 'serverAllocations'),
            where('serverId', '==', serverId),
            limit(1)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const allocationData = querySnapshot.docs[0].data();
            return allocationData.username || 'root';
        }
        return 'root';
    } catch (error) {
        console.warn(`Could not fetch allocation for server ${serverId}, defaulting to 'root' user.`, error);
        return 'root';
    }
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
    });

    if (!createResult.success || !createResult.id) {
        console.error('Failed to create log entry for command:', command);
        return;
    }
    const logId = createResult.id;
    
    // Immediately revalidate to show the "pending" log entry
    revalidatePath(`/root/servers/${serverId}`);

    const ssh = new NodeSSH();
    const { server, error: serverError } = await getPrivateServerDetails(serverId);

    if (serverError || !server || !server.publicIp || !server.privateKey) {
        await updateServerLog(logId, {
            status: 'failed',
            output: `Failed to retrieve server credentials: ${serverError || 'Missing IP or private key.'}`
        });
        revalidatePath(`/root/servers/${serverId}`);
        return;
    }

    try {
        await updateServerLog(logId, { status: 'ongoing', output: `Connecting to ${server.publicIp}...` });
        revalidatePath(`/root/servers/${serverId}`);

        const username = await getAllocationUsername(serverId);

        await ssh.connect({
            host: server.publicIp,
            username: username,
            privateKey: server.privateKey
        });

        await updateServerLog(logId, { output: `Connection successful as '${username}'. Running command...\n\n$ ${command}` });
        revalidatePath(`/root/servers/${serverId}`);

        const result = await ssh.execCommand(command);
        
        let finalOutput = '';
        if (result.stdout) {
            finalOutput += `STDOUT:\n${result.stdout}\n\n`;
        }
        if (result.stderr) {
            finalOutput += `STDERR:\n${result.stderr}\n\n`;
        }
        finalOutput += `Exited with code: ${result.code}`;

        await updateServerLog(logId, {
            status: result.code === 0 ? 'completed' : 'failed',
            output: finalOutput,
            completedAt: new Date().toISOString(), // Use client-side timestamp for now, can be replaced by serverTimestamp if needed
        });

    } catch (error: any) {
        await updateServerLog(logId, {
            status: 'failed',
            output: `SSH Connection or Command Execution Failed:\n${error.message}`,
            completedAt: new Date().toISOString(),
        });
    } finally {
        if(ssh.isConnected()) {
            ssh.dispose();
        }
        revalidatePath(`/root/servers/${serverId}`);
    }
}
