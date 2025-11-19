

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
    commandNameToLog?: string,
): Promise<{ success: boolean; error?: string; logId?: string; finalStatus?: ServerLog['status'] }> {
    const isCommandId = !commandIdentifier.includes(' ') && !commandIdentifier.includes('\n');
    let commandId: string | undefined = isCommandId ? commandIdentifier : undefined;
    let rawCommandTemplate: string = isCommandId ? '' : commandIdentifier;
    
    let confidentialParamKeys: string[] = [];
    let allocatesPort = false;
    let commandName: string | undefined = commandNameToLog;

    if (commandId) {
        const commandDetails = await getServerCommand(commandId);
        if (commandDetails.success && commandDetails.command) {
            const cmd = commandDetails.command;
            rawCommandTemplate = cmd.commandTemplate;
            allocatesPort = cmd.allocatesPort || false;
            // Prioritize the explicitly passed command name, but fall back to the template's name.
            if (!commandName) {
                commandName = cmd.name;
            }
            confidentialParamKeys = cmd.parameters?.filter(p => p.confidential).map(p => p.key) || [];
        } else {
             await logErrorToFirestore({ message: `Could not find command with ID: ${commandId}`, source: 'runCommand' });
             return { success: false, error: `Command with ID ${commandId} not found.` };
        }
    }

    let { preExecutionScript, bashCommand } = parseCommandTemplate(rawCommandTemplate);
    
    // --- STAGE 1: Pre-computation and Variable Resolution on Application Server ---
    const { server, error: serverError } = await getPrivateServerDetails(serverId);
    if (serverError || !server || !server.publicIp || !server.privateKey) {
        const errorMsg = `Failed to retrieve server credentials: ${serverError || 'Missing IP or private key.'}`;
        await logErrorToFirestore({ message: errorMsg, source: 'runCommand.init' });
        return { success: false, error: errorMsg };
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

    const resolvedAppPath = server.appPath?.replace(/\{\{\s*universal\.site_id\s*\}\}/g, site?.id || '') || `/var/www/${site?.id}`;

    const appServerVariables = {
        'universal.server_name': server.name,
        'universal.server_publicIp': server.publicIp,
        'universal.server_basePath': server.basePath || `/home/${server.username || 'root'}`,
        'universal.server_appPath': resolvedAppPath,
        'universal.site_id': site?.id || '',
        'universal.site_name': site?.name || '',
        'universal.site_domain': site?.domains?.map(d => d.value).join(' ') || '',
        'universal.account_id': accountId || '',
        'universal.account_githubToken': githubAccessToken,
    };
    
    let templateParams = { ...processedParams };
    const allParamsForPreExecution = { ...templateParams, ...appServerVariables };
    
    // --- Execute Pre-Processor Script ---
    if (preExecutionScript) {
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
                bashCommand = scriptResult;
            } else if (typeof scriptResult === 'object' && scriptResult !== null) {
                templateParams = { ...templateParams, ...scriptResult };
            }
        } catch (scriptError: any) {
            await logErrorToFirestore({ message: `Pre-execution script failed: ${scriptError.message}`, source: 'runCommand.preExec' });
            return { success: false, error: 'Pre-execution script failed.'};
        }
    }
    
    // --- Create final params object AFTER pre-execution ---
    const allFinalParams = { ...templateParams, ...appServerVariables };
    
    // --- Replace App Server Variables in Bash Command ---
    let commandToExecute = bashCommand;
    for (const [key, value] of Object.entries(allFinalParams)) {
         const placeholderRegex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
         commandToExecute = commandToExecute.replace(placeholderRegex, String(value));
    }
    
    // --- Create a separate command for logging, with confidential data masked ---
    let loggedCommand = bashCommand;
    const allParamsForLogging = { ...allFinalParams };
    confidentialParamKeys.forEach(key => {
        if (allParamsForLogging[key]) {
            allParamsForLogging[key] = '********';
        }
    });
    // Mask GitHub token as well, as it is always confidential
    if(allParamsForLogging['universal.account_githubToken']) {
        allParamsForLogging['universal.account_githubToken'] = '********';
    }
     for (const [key, value] of Object.entries(allParamsForLogging)) {
         const placeholderRegex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
         loggedCommand = loggedCommand.replace(placeholderRegex, String(value));
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
        return { success: false, error: createResult.error };
    }
    const logId = createResult.id;
    
    revalidatePath(`/root/servers/${serverId}`);

    // --- STAGE 2: Generate wrapper script for Target Server variable resolution and swap management ---
    const finalCommand = `
set -e
SWAP_FILE="/swapfile_runner"

cleanup() {
    if [ -f "$SWAP_FILE" ]; then
        echo "--- Removing temporary swap file ---"
        sudo swapoff "$SWAP_FILE"
        sudo rm -f "$SWAP_FILE"
    fi
}
trap cleanup EXIT

echo "--- Creating 4GB temporary swap file ---"
sudo fallocate -l 4G "$SWAP_FILE"
sudo chmod 600 "$SWAP_FILE"
sudo mkswap "$SWAP_FILE"
sudo swapon "$SWAP_FILE"
echo "--- Swap file created ---"

get_available_port() {
    comm -23 <(seq 49152 65535 | sort) <(ss -tan | awk 'NR>1 {print $4}' | cut -d':' -f2 | sort -u) | shuf | head -n 1
}
APP_PORT=${allocatesPort ? "$(get_available_port)" : "''"}
export APP_PORT

cat <<'BASH_COMMAND_EOF' | sed "s/{{universal.app_port}}/$APP_PORT/g" | bash
${commandToExecute}
BASH_COMMAND_EOF
        `;

    const ssh = new NodeSSH();
    let finalOutput = '';
    let finalStatus: ServerLog['status'] = 'failed';

    try {
        await updateServerLog(logId, { status: 'ongoing', output: `Connecting to ${server.publicIp}...` });
        
        await ssh.connect({ host: server.publicIp, username: server.username || 'root', privateKey: server.privateKey });
        
        await updateServerLog(logId, { output: `Connection successful. Running command...` });

        const result = await ssh.execCommand(finalCommand);
        
        finalOutput += result.stdout ? `STDOUT:\n${result.stdout}\n` : '';
        finalOutput += result.stderr ? `\nSTDERR:\n${result.stderr}\n` : '';
        
        finalStatus = result.code === 0 ? 'completed' : 'failed';
        finalOutput += `\nExited with code: ${result.code}`;
        await updateServerLog(logId, { status: finalStatus, output: finalOutput });

    } catch (error: any) {
        finalOutput = `${finalOutput}\n\n--- ERROR ---\nAn unexpected error occurred: ${error.message || String(error)}`; 
        if (error.message.includes('All configured authentication methods failed')) {
            finalOutput = `SSH Authentication Failed. Please check server credentials and username. Error: ${error.message}`;
        } else if (error.message.includes('Connection timed out')) {
            finalOutput = `SSH Connection Timed Out. Server might be unreachable or IP is incorrect. Error: ${error.message}`;
        }
        finalStatus = 'failed';
        await updateServerLog(logId, { status: finalStatus, output: `Error during command execution: ${finalOutput}` });
        await logErrorToFirestore({ message: `Runner Error for server ${serverId}, log ${logId}:`, stack: error.stack, source: 'runCommand.main' });
    } finally {
        if(ssh.isConnected()) {
            ssh.dispose();
        }
        revalidatePath(`/root/servers/${serverId}`);
    }
    
    return { success: finalStatus === 'completed', logId, finalStatus };
}






