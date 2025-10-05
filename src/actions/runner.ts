
'use server';

import { createServerLog, updateServerLog } from '@/actions/server-logs';
import { getPrivateServerDetails } from '@/actions/servers';
import { revalidatePath } from 'next/cache';
import { NodeSSH } from 'node-ssh';

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

        // Use the server's own username, not an allocation's.
        const username = server.username;
        if (!username) {
            throw new Error('Server username is not defined. Please edit the server to set a username.');
        }

        await updateServerLog(logId, { status: 'ongoing', output: `Connecting to ${server.publicIp}...` });
        revalidatePath(`/root/servers/${serverId}`);

        await ssh.connect({
            host: server.publicIp,
            username: username,
            privateKey: server.privateKey
        });

        await updateServerLog(logId, { output: `Connection successful as '${username}'. Running command...

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
        } else if (error.message.includes('Failed to retrieve server credentials')) {
             finalOutput = `Failed to retrieve server credentials. Error: ${error.message}`;
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
