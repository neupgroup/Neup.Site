
'use server';

import { createServerLog, updateServerLog } from '@/actions/server-logs';
import { getPrivateServerDetails, updateServer } from '@/actions/servers';
import { revalidatePath } from 'next/cache';
import { NodeSSH } from 'node-ssh';
import { getFirestore, collection, query, where, getDocs, limit, doc, getDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/lib/firebase';
import { logErrorToFirestore } from '@/lib/logging';
import vm from 'vm';
import { getServerCommand } from './commands';
import { getLinkedAccounts, getAccountId } from './accounts';

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

interface PortAllocationParams {
    port: number;
    description: string;
}

export async function runCommand(
    serverId: string,
    commandTemplate: string,
    processedParams: Record<string, any> = {},
    preprocess?: boolean,
    portAllocation?: PortAllocationParams,
    commandId?: string
) {
    if (!commandTemplate) {
        console.error('Runner Error: No command template provided.');
        return;
    }
    
    let confidentialParamKeys: string[] = [];
    if (commandId) {
        const commandDetails = await getServerCommand(commandId);
        if (commandDetails.success && commandDetails.command && commandDetails.command.parameters) {
            confidentialParamKeys = commandDetails.command.parameters
                .filter(p => p.confidential)
                .map(p => p.key);
        }
    }
    
    let loggedCommand = commandTemplate;
    for (const key of confidentialParamKeys) {
        if (processedParams[key]) {
            const maskedValue = '*'.repeat(String(processedParams[key]).length);
            loggedCommand = loggedCommand.replace(new RegExp(`{{${key}}}`, 'g'), maskedValue);
        }
    }

    const createResult = await createServerLog({
        serverId: serverId,
        command: loggedCommand, 
        output: `Initiating command...`,
        status: 'pending',
    });

    if (!createResult.success || !createResult.id) {
        console.error('Failed to create log entry for command:', loggedCommand, 'Error:', createResult.error);
        return;
    }
    const logId = createResult.id;
    
    revalidatePath(`/root/servers/${serverId}`);

    const ssh = new NodeSSH();
    let finalOutput = ''; 
    let finalCommand = commandTemplate;

    try {
        const { server, error: serverError } = await getPrivateServerDetails(serverId);
        if (serverError || !server || !server.publicIp || !server.privateKey) {
            throw new Error(`Failed to retrieve server credentials: ${serverError || 'Missing IP or private key.'}`);
        }
        
        const accountId = await getAccountId();
        
        let githubAccessToken = '';
        try {
            const accountsResult = await getLinkedAccounts();
            if (accountsResult.success && accountsResult.accounts) {
                const githubAccount = accountsResult.accounts.find(acc => acc.platform === 'github');
                if (githubAccount) {
                    githubAccessToken = githubAccount.authorization_info.access_token;
                }
            }
        } catch (e: any) {
             console.error('Failed to fetch GitHub token for universal variable.', e);
        }

        const openPorts = server.portsOpen || [];
        const usedPorts = [...(server.usedPorts || []), ...(portAllocation ? [portAllocation] : [])].map(p => p.port);
        const availablePorts = openPorts.filter(p => !usedPorts.includes(p));

        const universal = {
            name: server.name,
            public_ip: server.publicIp,
            provider: server.provider || '',
            username: server.username || '',
            base_path: server.basePath || '',
            available_port: availablePorts[0]?.toString() || '',
            available_ports: availablePorts.join(','),
            used_ports: usedPorts.join(','),
            linked_account_github: githubAccessToken,
            account_id: accountId,
        };
        
        if (preprocess) {
            finalOutput += 'Running pre-execution script on server...\n';
            await updateServerLog(logId, { status: 'ongoing', output: finalOutput });
            
            try {
                // The sandbox only gets user-provided parameters
                const sandbox = { params: processedParams, result: '' };
                vm.createContext(sandbox);
                
                const scriptToRun = `result = (() => { ${commandTemplate} })();`;
                vm.runInContext(scriptToRun, sandbox, { timeout: 2000 });
                
                if (typeof sandbox.result !== 'string') {
                    throw new Error('Pre-execution script must return a string.');
                }
                finalCommand = sandbox.result;
                finalOutput += `Pre-execution script completed. Final command generated.\n\n`;
                await updateServerLog(logId, { output: finalOutput });
            } catch (scriptError: any) {
                throw new Error(`Pre-execution script failed: ${scriptError.message}`);
            }
        } else {
             // Substitute user parameters directly if not pre-processing
            for (const [key, value] of Object.entries(processedParams)) {
                finalCommand = finalCommand.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
            }
        }
        
        // Phase 2: Substitute universal variables into the final command string
        for (const [key, value] of Object.entries(universal)) {
            if (value) { // Only substitute if value is not empty
                finalCommand = finalCommand.replace(new RegExp(`{{universal.${key}}}`, 'g'), String(value));
            }
        }

        if (portAllocation && portAllocation.port) {
             await updateServerLog(logId, { status: 'ongoing', output: `${finalOutput}Allocating port ${portAllocation.port}...` });
             
             const currentUsedPorts = server.usedPorts || [];
             if (currentUsedPorts.some(p => p.port === portAllocation.port)) {
                 throw new Error(`Port allocation failed: Port ${portAllocation.port} is already in use.`);
             }

             const updateResult = await updateServer(serverId, {
                 usedPorts: [...currentUsedPorts, portAllocation]
             });

             if (!updateResult.success) {
                 throw new Error(`Failed to update server with new port allocation: ${updateResult.error}`);
             }
             finalOutput += `Successfully allocated port ${portAllocation.port} for: ${portAllocation.description}\n\n`;
             await updateServerLog(logId, { output: finalOutput });
             revalidatePath(`/root/servers/${serverId}`);
        }
        
        const remainingPlaceholders = finalCommand.match(/\{\{([^}]+)\}\}/g);
        if (remainingPlaceholders) {
            throw new Error(`Unresolved placeholders remaining: ${remainingPlaceholders.join(', ')}`);
        }

        const username = await getAllocationUsername(serverId) || server.username || 'root';

        await updateServerLog(logId, { status: 'ongoing', output: `${finalOutput}Connecting to ${server.publicIp}...` });
        revalidatePath(`/root/servers/${serverId}`);

        await ssh.connect({
            host: server.publicIp,
            username: username,
            privateKey: server.privateKey
        });

        // Log the final command, masking any confidential parameters
        const loggedFinalCommand = confidentialParamKeys.reduce((cmd, key) => {
            if (processedParams[key]) {
                const valueToMask = String(processedParams[key]);
                 // Escape special regex characters in the value to be masked
                const escapedValue = valueToMask.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const maskedValue = '*'.repeat(valueToMask.length);
                return cmd.replace(new RegExp(escapedValue, 'g'), maskedValue);
            }
            return cmd;
        }, finalCommand);


        await updateServerLog(logId, { output: `${finalOutput}Connection successful as '${username}'. Running command...\n\n$ ${loggedFinalCommand}` });
        revalidatePath(`/root/servers/${serverId}`);

        const result = await ssh.execCommand(finalCommand);
        
        if (result.stdout) {
            finalOutput += `\n\nSTDOUT:\n${result.stdout}\n`;
        }
        if (result.stderr) {
            finalOutput += `\nSTDERR:\n${result.stderr}\n`;
        }
        finalOutput += `\nExited with code: ${result.code}`;

        await updateServerLog(logId, {
            status: result.code === 0 ? 'completed' : 'failed',
            output: finalOutput,
            completedAt: new Date().toISOString(), 
        });

    } catch (error: any) {
        finalOutput = `${finalOutput}\n\n--- ERROR ---\nAn unexpected error occurred: ${error.message || String(error)}`; 
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
        await logErrorToFirestore({ message: `Runner Error for server ${serverId}, log ${logId}:`, stack: error.stack, source: 'runCommand.main' });
    } finally {
        if(ssh.isConnected()) {
            ssh.dispose();
        }
        revalidatePath(`/root/servers/${serverId}`);
    }
}
