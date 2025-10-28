
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

const getAvailablePorts = (usedPorts: number[]): number[] => {
    const allPorts = Array.from({ length: 65535 - 1024 + 1 }, (_, i) => 1024 + i);
    const usedPortsSet = new Set(usedPorts);
    return allPorts.filter(port => !usedPortsSet.has(port));
};

function parseCommandTemplate(template: string): { preExecutionScript?: string; bashCommand: string; } {
    const preProcessorMatch = template.match(/<javascript.preProcessor>([\s\S]*?)<\/javascript.preProcessor>/);
    const bashMatch = template.match(/<server.ubuntuBashProcessor>([\s\S]*?)<\/server.ubuntuBashProcessor>/);

    const preExecutionScript = preProcessorMatch ? preProcessorMatch[1].trim() : undefined;
    const bashCommand = bashMatch ? bashMatch[1].trim() : template; // Fallback to the whole template if no tags found

    return { preExecutionScript, bashCommand };
}


export async function runCommand(
    serverId: string,
    commandIdentifier: string, // This can be a command ID or a raw command string
    processedParams: Record<string, any> = {},
) {
    const isCommandId = !commandIdentifier.includes(' '); // Simple check
    let commandId: string | undefined = isCommandId ? commandIdentifier : undefined;
    let rawCommandTemplate: string = isCommandId ? '' : commandIdentifier;
    let loggedCommand = rawCommandTemplate;
    let confidentialParamKeys: string[] = [];
    let allocatesPort = false;
    let portToReserve: string | undefined = undefined;
    let commandName: string | undefined;

    if (commandId) {
        const commandDetails = await getServerCommand(commandId);
        if (commandDetails.success && commandDetails.command) {
            const cmd = commandDetails.command;
            rawCommandTemplate = cmd.commandTemplate;
            loggedCommand = cmd.commandTemplate; // Will be refined later
            allocatesPort = cmd.allocatesPort || false;
            portToReserve = cmd.portToReserve;
            commandName = cmd.name;
            confidentialParamKeys = cmd.parameters?.filter(p => p.confidential).map(p => p.key) || [];

        } else {
             await logErrorToFirestore({ message: `Could not find command with ID: ${commandId}`, source: 'runCommand' });
             return; // Exit if command not found
        }
    }

    const { preExecutionScript, bashCommand } = parseCommandTemplate(rawCommandTemplate);
    
    // Mask confidential parameters for logging
    for (const key of confidentialParamKeys) {
        if (processedParams[key]) {
            const maskedValue = '*'.repeat(String(processedParams[key]).length);
            loggedCommand = loggedCommand.replace(new RegExp(`{{${key}}}`, 'g'), maskedValue);
        }
    }

    const createResult = await createServerLog({
        serverId: serverId,
        commandId,
        commandName: commandName || 'Custom Command',
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
    let finalCommand = bashCommand;
    let actualReservedPort: number | undefined;

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

        const usedPorts = (server.usedPorts || []).map(p => p.port);
        const availablePorts = getAvailablePorts(usedPorts);
        
        if (allocatesPort && portToReserve) {
            let portToUse: number;
            if (portToReserve === '{{universal.available_port}}') {
                if (availablePorts.length === 0) {
                    throw new Error("Port allocation failed: No available ports on the server.");
                }
                portToUse = availablePorts[0];
            } else {
                portToUse = parseInt(portToReserve, 10);
                if (isNaN(portToUse) || usedPorts.includes(portToUse)) {
                    throw new Error(`Port allocation failed: Port ${portToReserve} is invalid or already in use.`);
                }
            }
            actualReservedPort = portToUse;

            finalOutput += `Attempting to reserve port ${actualReservedPort}...\n`;
            await updateServerLog(logId, { status: 'ongoing', output: finalOutput });
             
             const updateResult = await updateServer(serverId, {
                 usedPorts: [...(server.usedPorts || []), { port: actualReservedPort, description: `Reserved by command: ${commandId || 'Custom'}` }]
             });

             if (!updateResult.success) {
                 throw new Error(`Failed to update server with new port allocation: ${updateResult.error}`);
             }
             finalOutput += `Successfully reserved port ${actualReservedPort}.\n\n`;
             await updateServerLog(logId, { output: finalOutput });
             revalidatePath(`/root/servers/${serverId}`);
        }

        const universal = {
            name: server.name,
            public_ip: server.publicIp,
            provider: server.provider || '',
            username: server.username || '',
            base_path: server.basePath || '',
            available_port: availablePorts[0]?.toString() || '',
            reserved_port: actualReservedPort?.toString() || '',
            used_ports: usedPorts.join(','),
            linked_account_github: githubAccessToken,
            account_id: accountId,
        };
        
        let templateParams = { ...processedParams };

        if (preExecutionScript) {
            finalOutput += 'Running pre-execution script...\n';
            await updateServerLog(logId, { status: 'ongoing', output: finalOutput });
            
            const sandbox = { params: processedParams, universal, result: {} };
            vm.createContext(sandbox);

            try {
                const scriptResult = vm.runInContext(preExecutionScript, sandbox, { timeout: 2000 });
                
                if (typeof scriptResult === 'string') {
                    // Method 1: The script returns the entire command string
                    finalCommand = scriptResult;
                    finalOutput += `Pre-execution script returned a complete command.\n\n`;
                } else if (typeof scriptResult === 'object' && scriptResult !== null) {
                    // Method 2: The script returns an object of parameters to inject
                    templateParams = { ...templateParams, ...scriptResult };
                    finalOutput += `Pre-execution script completed. Merged script results with parameters.\n\n`;
                } else {
                     finalOutput += `Pre-execution script ran, but did not return a valid object or string. Proceeding...\n\n`;
                }

                await updateServerLog(logId, { output: finalOutput });
            } catch (scriptError: any) {
                throw new Error(`Pre-execution script failed: ${scriptError.message}`);
            }
        }
        
        // Substitute all parameters (user-provided and script-generated)
        for (const [key, value] of Object.entries(templateParams)) {
            finalCommand = finalCommand.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
        }
        // Also substitute universal variables
        for (const [key, value] of Object.entries(universal)) {
            if (value) {
                finalCommand = finalCommand.replace(new RegExp(`{{universal.${key}}}`, 'g'), String(value));
            }
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
        
        const loggedFinalCommand = confidentialParamKeys.reduce((cmd, key) => {
            if (templateParams[key]) {
                const valueToMask = String(templateParams[key]);
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
        });
        await logErrorToFirestore({ message: `Runner Error for server ${serverId}, log ${logId}:`, stack: error.stack, source: 'runCommand.main' });
    } finally {
        if(ssh.isConnected()) {
            ssh.dispose();
        }
        revalidatePath(`/root/servers/${serverId}`);
    }
}
