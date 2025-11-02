
'use server';

import { createServerLog, updateServerLog } from '@/actions/server-logs';
import { getPrivateServerDetails } from '@/actions/servers';
import { revalidatePath } from 'next/cache';
import { NodeSSH } from 'node-ssh';
import { logErrorToFirestore } from '@/lib/logging';
import vm from 'vm';
import { getServerCommand } from './commands';
import { getLinkedAccounts, getAccountId } from './accounts';
import { getSite } from './editor/site';


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
    
    // Mask confidential parameters before creating the initial log
    for (const key of confidentialParamKeys) {
        if (processedParams[key]) {
            const maskedValue = '*'.repeat(String(processedParams[key]).length);
            loggedCommand = loggedCommand.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), maskedValue);
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

    try {
        // --- STAGE 1: Pre-computation and Variable Resolution on Application Server ---
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
                 console.warn('Failed to fetch GitHub token for universal variable.', e);
            }
        }
        
        const siteResult = await getSite();
        const site = siteResult.success ? siteResult.site : null;

        // Resolve appPath which depends on site_id
        const resolvedAppPath = server.appPath?.replace(/\{\{\s*universal\.site_id\s*\}\}/g, site?.id || '') || `/var/www/${site?.id}`;

        const appServerVariables = {
            'server_name': server.name,
            'server_publicIp': server.publicIp,
            'server_basePath': server.basePath || `/home/${server.username || 'root'}`,
            'server_appPath': resolvedAppPath,
            'site_id': site?.id || '',
            'site_name': site?.name || '',
            'site_domain': site?.domains?.map(d => d.value).join(' ') || '',
            'account_id': accountId || '',
            'account_githubToken': githubAccessToken,
        };

        let templateParams = { ...processedParams };
        const allParamsForPreExecution = { ...templateParams, ...appServerVariables };
        
        let commandToExecute = bashCommand;

        // --- Execute Pre-Processor Script ---
        if (preExecutionScript) {
            finalOutput += 'Running pre-execution script...\n';
            await updateServerLog(logId, { status: 'ongoing', output: finalOutput });

            let scriptWithInjectedParams = preExecutionScript;
            for (const [key, value] of Object.entries(allParamsForPreExecution)) {
                const placeholderRegex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
                scriptWithInjectedParams = scriptWithInjectedParams.replace(placeholderRegex, JSON.stringify(value));
            }
            
            const sandbox = {};
            vm.createContext(sandbox);

            try {
                const scriptToRun = `(() => { ${scriptWithInjectedParams} })();`;
                const scriptResult = vm.runInContext(scriptToRun, sandbox, { timeout: 2000 });
                
                if (typeof scriptResult === 'string') {
                    commandToExecute = scriptResult;
                    finalOutput += `Pre-execution script returned a new command.\n\n`;
                } else if (typeof scriptResult === 'object' && scriptResult !== null) {
                    templateParams = { ...templateParams, ...scriptResult };
                    finalOutput += `Pre-execution script completed. Merged results with parameters.\n\n`;
                } else {
                     finalOutput += `Pre-execution script ran. Proceeding...\n\n`;
                }
                 await updateServerLog(logId, { output: finalOutput });
            } catch (scriptError: any) {
                throw new Error(`Pre-execution script failed: ${scriptError.message}`);
            }
        }
        
        // --- Replace App Server Variables in Bash Command ---
        let partiallyResolvedCommand = commandToExecute;
        const allResolvedParams = { ...templateParams, ...appServerVariables };
        for (const [key, value] of Object.entries(allResolvedParams)) {
             const placeholderRegex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
             partiallyResolvedCommand = partiallyResolvedCommand.replace(placeholderRegex, String(value));
        }
        
        // --- STAGE 2: Generate wrapper script for Target Server variable resolution ---
        const runtimeResolutionScript = `
set -e
get_available_port() {
    comm -23 <(seq 49152 65535 | sort) <(ss -tan | awk 'NR>1 {print $4}' | cut -d':' -f2 | sort -u) | shuf | head -n 1
}
SERVER_AVAILABLE_PORT=$(get_available_port)
export SERVER_RESERVED_PORT=${allocatesPort ? '$SERVER_AVAILABLE_PORT' : '""'}
export SERVER_AVAILABLE_PORTS=$(ss -tan | awk 'NR>1 {print $4}' | cut -d':' -f2 | sort -u | tr '\\n' ',' | sed 's/,$//')
export SERVER_USED_PORTS=$SERVER_AVAILABLE_PORTS

cat <<'BASH_COMMAND_EOF' | sed "s/{{universal.server_availablePort}}/$SERVER_AVAILABLE_PORT/g" | sed "s/{{universal.server_reservedPort}}/$SERVER_RESERVED_PORT/g" | sed "s/{{universal.server_availablePorts}}/$SERVER_AVAILABLE_PORTS/g" | sed "s/{{universal.server_usedPorts}}/$SERVER_USED_PORTS/g" | bash
${partiallyResolvedCommand}
BASH_COMMAND_EOF
        `;

        const finalCommand = runtimeResolutionScript;

        await updateServerLog(logId, { status: 'ongoing', output: `${finalOutput}Connecting to ${server.publicIp}...` });
        revalidatePath(`/root/servers/${serverId}`);

        await ssh.connect({ host: server.publicIp, username: server.username || 'root', privateKey: server.privateKey });
        
        await updateServerLog(logId, { output: `${finalOutput}Connection successful. Running command...` });

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
