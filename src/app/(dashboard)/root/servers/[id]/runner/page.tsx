
'use server';

import { createServerLog, updateServerLog } from '@/actions/server-logs';
import { getPrivateServerDetails } from '@/actions/servers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { NodeSSH } from 'node-ssh';

async function runCommand(serverId: string, command: string) {
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

        await ssh.connect({
            host: server.publicIp,
            username: 'root', // This might need to be configurable
            privateKey: server.privateKey
        });

        await updateServerLog(logId, { output: `Connection successful. Running command...\n\n$ ${command}` });
        revalidatePath(`/root/servers/${serverId}`);

        const result = await ssh.execCommand(command, {
            onStdout: (chunk) => {
                // This could be used for real-time streaming in the future
            },
            onStderr: (chunk) => {
                 // This could be used for real-time streaming in the future
            }
        });
        
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
        });

    } catch (error: any) {
        await updateServerLog(logId, {
            status: 'failed',
            output: `SSH Connection or Command Execution Failed:\n${error.message}`
        });
    } finally {
        if(ssh.isConnected()) {
            ssh.dispose();
        }
        revalidatePath(`/root/servers/${serverId}`);
    }
}

// This function will be called via a form POST
export default async function RunnerPage({ params, request }: { params: { id: string }, request: Request }) {
    const { id } = params;
    const formData = await request.formData();
    const command = formData.get('command') as string;

    if (command) {
        await runCommand(id, command);
    }
    
    // Always redirect back after handling the action
    redirect(`/root/servers/${id}`);
}
