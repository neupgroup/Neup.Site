
'use server';

import { createServerLog, updateServerLog } from '@/actions/server-logs';
import { getPrivateServerDetails, updateServer, getSiteServers, getServer } from '@/actions/servers';
import { revalidatePath } from 'next/cache';
import { NodeSSH } from 'node-ssh';
import { getFirestore, collection, query, where, getDocs, limit, doc, getDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/lib/firebase';
import { logErrorToFirestore } from '@/lib/logging';
import vm from 'vm';
import { getServerCommand } from './commands';
import { getLinkedAccounts, getAccountId } from './accounts';
import type { Server, UsedPort, ServerAllocation } from '@/schemas/server';
import { getActivePorts } from './server/management/get-active-ports';
import { getSite } from './editor/site';


const getAvailablePorts = (allUsedPorts: number[]): number[] => {
    const allPorts = Array.from({ length: 65535 - 1024 + 1 }, (_, i) => 1024 + i);
    const usedPortsSet = new Set(allUsedPorts);
    return allPorts.filter(port => !usedPortsSet.has(port));
};

function parseCommandTemplate(template: string): { preExecutionScript?: string; bashCommand: string; } {
    const preProcessorMatch = template.match(/<javascript.preProcessor>([\s\S]*?)<\/javascript.preProcessor>/);
    const bashMatch = template.match(/<server.ubuntuBashProcessor>([\s\S]*?)<\/server.ubuntuBashProcessor>/);

    const preExecutionScript = preProcessorMatch ? preProcessorMatch[1].trim() : undefined;
    const bashCommand = bashMatch ? bashMatch[1].trim() : template;

    return { preExecutionScript, bashCommand };
}

export async function runCommand(
    serverId: string,
    commandIdentifier: string,
    processedParams: Record<string, any> = {},
) {
    const isCommandId = !commandIdentifier.includes(' ');
    let commandId: string | undefined = isCommandId ? commandIdentifier : undefined;
    let rawCommandTemplate: string = isCommandId ? '' : commandIdentifier;
    let loggedCommand = rawCommandTemplate;
    let confidentialParamKeys: string[] = [];
    let allocatesPort = false;
    let commandName: string | undefined;

    if (commandId) {
        const commandDetails = await getServerCommand(commandId);
        if (commandDetails.success && commandDetails.command) {
            const cmd = commandDetails.command;
            rawCommandTemplate = cmd.commandTemplate;
            loggedCommand = cmd.commandTemplate;
            allocatesPort = cmd.allocatesPort || false;
            commandName = cmd.name;
            confidentialParamKeys = cmd.parameters?.filter(p => p.confidential).map(p => p.key) || [];

        } else {
             await logErrorToFirestore({ message: `Could not find command with ID: ${commandId}`, source: 'runCommand' });
             return;
        }
    }

    let { preExecutionScript, bashCommand } = parseCommandTemplate(rawCommandTemplate);
    
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
        if (accountId) {
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
        }
        
        const { ports: activePorts } = await getActivePorts(serverId);
        const allUsedPortsSet = new Set(activePorts?.map(p => p.port) || []);

        const availablePorts = getAvailablePorts(Array.from(allUsedPortsSet));

        let site_name = '';
        let site_id = '';
        let server_appPath = '';
        const siteResult = await getSite();
        if(siteResult.success && siteResult.site) {
            site_name = siteResult.site.name;
            site_id = siteResult.site.id;
            if(server.basePath && site_name) {
                server_appPath = `${server.basePath}/${site_name}`;
            }
        }

        const universal = {
            server_name: server.name,
            server_publicIp: server.publicIp,
            server_availablePorts: availablePorts.slice(0, 10).join(','),
            server_availablePort: availablePorts[0]?.toString() || '',
            server_reservedPort: '',
            server_usedPorts: Array.from(allUsedPortsSet).join(','),
            server_basePath: server.basePath || '',
            server_appPath: server_appPath,
            site_id: site_id,
            site_name: site_name,
            account_id: accountId,
            account_githubToken: githubAccessToken,
        };
        
        if (allocatesPort && universal.server_availablePort) {
            universal.server_reservedPort = universal.server_availablePort;
            actualReservedPort = parseInt(universal.server_availablePort, 10);
        }
        
        let templateParams = { ...processedParams };
        const allParamsForInjection = { ...templateParams, ...universal };


        if (preExecutionScript) {
            finalOutput += 'Running pre-execution script...\n';
            await updateServerLog(logId, { status: 'ongoing', output: finalOutput });
            
            // Inject all available parameters into the script body
            let scriptWithInjectedParams = preExecutionScript;
            for (const [key, value] of Object.entries(allParamsForInjection)) {
                const placeholder = `{{${key}}}`;
                 // Using JSON.stringify ensures values are correctly escaped for JS
                scriptWithInjectedParams = scriptWithInjectedParams.replace(new RegExp(placeholder, 'g'), JSON.stringify(value));
            }
            
            const sandbox = {}; // Empty sandbox, as variables are now directly in the script
            vm.createContext(sandbox);

            try {
                const scriptToRun = `(() => { ${scriptWithInjectedParams} })();`;
                const scriptResult = vm.runInContext(scriptToRun, sandbox, { timeout: 2000 });
                
                if (typeof scriptResult === 'string') {
                    finalCommand = scriptResult;
                    finalOutput += `Pre-execution script returned a complete command.\n\n`;
                } else if (typeof scriptResult === 'object' && scriptResult !== null) {
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
        
        const allParamsForBash = { ...templateParams, ...universal };
        for (const [key, value] of Object.entries(allParamsForBash)) {
            finalCommand = finalCommand.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
        }
        
        const remainingPlaceholders = finalCommand.match(/\{\{([^}]+)\}\}/g);
        if (remainingPlaceholders) {
            throw new Error(`Unresolved placeholders remaining: ${remainingPlaceholders.join(', ')}`);
        }

        const username = server.username || 'root';

        await updateServerLog(logId, { status: 'ongoing', output: `${finalOutput}Connecting to ${server.publicIp}...` });
        revalidatePath(`/root/servers/${serverId}`);

        await ssh.connect({ host: server.publicIp, username, privateKey: server.privateKey });
        
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
        
        finalOutput += result.stdout ? `\n\nSTDOUT:\n${result.stdout}\n` : '';
        finalOutput += result.stderr ? `\nSTDERR:\n${result.stderr}\n` : '';
        finalOutput += `\nExited with code: ${result.code}`;
        
        const finalStatus = result.code === 0 ? 'completed' : 'failed';
        await updateServerLog(logId, { status: finalStatus, output: finalOutput });

    } catch (error: any) {
        finalOutput = `${finalOutput}\n\n--- ERROR ---\nAn unexpected error occurred: ${error.message || String(error)}`; 
        if (error.message.includes('All configured authentication methods failed')) {
            finalOutput = `SSH Authentication Failed. Please check server credentials and username. Error: ${error.message}`;
        } else if (error.message.includes('Connection timed out')) {
            finalOutput = `SSH Connection Timed Out. Server might be unreachable or IP is incorrect. Error: ${error.message}`;
        }

        await updateServerLog(logId, { status: 'failed', output: `Error during command execution: ${finalOutput}` });
        await logErrorToFirestore({ message: `Runner Error for server ${serverId}, log ${logId}:`, stack: error.stack, source: 'runCommand.main' });
    } finally {
        if(ssh.isConnected()) {
            ssh.dispose();
        }
        revalidatePath(`/root/servers/${serverId}`);
    }
}
