'use server';

import { createServerLog, updateServerLog } from '@/actions/server-logs';
import { getPrivateServerDetails, updateServer } from '@/actions/servers'; // Make sure updateServer is imported
import { revalidatePath } from 'next/cache';
import { NodeSSH } from 'node-ssh';
import { logErrorToFirestore } from '@/lib/logging';
import vm from 'vm';
import { getServerCommand } from './commands';
import { getLinkedAccounts, getAccountId } from './accounts';
import { getSite } from './editor/site';
import type { ServerLog } from '@/schemas/server';
import { generateReverseProxyBashScript } from './server/management/reverse-proxy-config';


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
): Promise<{ success: boolean; error?: string; logId?: string; finalStatus?: ServerLog['status']; nextCommandResults?: { commandId: string; success: boolean; logId?: string }[] }> {
    const isCommandId = !commandIdentifier.includes(' ') && !commandIdentifier.includes('\n') && !commandIdentifier.includes('<');
    let commandId: string | undefined = isCommandId ? commandIdentifier : undefined;
    let rawCommandTemplate: string = isCommandId ? '' : commandIdentifier;

    let confidentialParamKeys: string[] = [];
    let allocatesPort = false;
    let commandName: string | undefined = commandNameToLog;

    const initialLogData: Omit<ServerLog, 'id' | 'initiatedAt' | 'completedAt'> = {
        serverId: serverId,
        commandName: commandName || (commandId ? 'Loading Command...' : 'Custom Command'),
        command: 'Preparing to execute...', // Placeholder
        output: `Initiating command...`,
        status: 'pending',
        initiatedBy: 'system',
    };

    if (commandId) {
        initialLogData.commandId = commandId;
    }

    const createResult = await createServerLog(initialLogData);

    if (!createResult.success || !createResult.id) {
        console.error('Failed to create initial log entry for command:', commandIdentifier, 'Error:', createResult.error);
        return { success: false, error: createResult.error };
    }
    const logId = createResult.id;
    revalidatePath(`/root/servers/${serverId}`);


    try {
        if (commandId) {
            const commandDetails = await getServerCommand(commandId);
            if (commandDetails.success && commandDetails.command) {
                const cmd = commandDetails.command;
                rawCommandTemplate = cmd.commandTemplate;
                allocatesPort = cmd.allocatesPort || false;
                if (!commandName) {
                    commandName = cmd.name;
                }
                confidentialParamKeys = cmd.parameters?.filter(p => p.confidential).map(p => p.key) || [];
                await updateServerLog(logId, { commandName });
            } else {
                throw new Error(`Command with ID ${commandId} not found.`);
            }
        }

        let { preExecutionScript, bashCommand } = parseCommandTemplate(rawCommandTemplate);

        const { server, error: serverError } = await getPrivateServerDetails(serverId);
        if (serverError || !server || !server.publicIp || !server.privateKey) {
            throw new Error(`Failed to retrieve server credentials: ${serverError || 'Missing IP or private key.'}`);
        }

        if (commandId === 'initial-server-setup') {
            await updateServer(serverId, { serverConfigured: true });
        }


        const accountId = await getAccountId();

        let githubAccessToken = '';
        if (accountId) {
            try {
                const accountsResult = await getLinkedAccounts();
                if (accountsResult.accounts) {
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
            'universal.siteId': site?.id || '',
            'universal.site_id': site?.id || '',
            'universal.site_name': site?.name || '',
            'universal.productionDomain': site?.domains?.production?.url || '',
            'universal.developmentDomain': site?.domains?.development?.url || '',
            'universal.account_id': accountId || '',
            'universal.account_githubToken': githubAccessToken,
        };

        let templateParams = { ...processedParams };
        const allParamsForPreExecution = { ...templateParams, ...appServerVariables };

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
                throw new Error(`Pre-execution script failed: ${scriptError.message}`);
            }
        }

        const allFinalParams = { ...templateParams, ...appServerVariables };

        let commandToExecute = bashCommand;
        for (const [key, value] of Object.entries(allFinalParams)) {
            const placeholderRegex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
            commandToExecute = commandToExecute.replace(placeholderRegex, String(value));
        }

        // Process <server.generateReverseProxy> tag
        const processReverseProxyTag = (command: string, params: Record<string, any>) => {
            const reverseProxyRegex = /<server\.generateReverseProxy>([\s\S]*?)<\/server\.generateReverseProxy>/;
            const match = command.match(reverseProxyRegex);
            if (match) {
                const domain = match[1].trim();
                const proxyPath = String(params['path'] || params['proxyPath'] || '/');
                const proxyIp = String(params['serverIp'] || params['proxyServerIp'] || '');
                const proxyPort = String(params['port'] || params['proxyPort'] || '');

                let ignoredPaths: string[] = [];
                const ignoredRaw = params['ignoredPaths'] || params['proxyIgnoredPaths'];
                if (typeof ignoredRaw === 'string') {
                    ignoredPaths = ignoredRaw.split(',').map(s => s.trim()).filter(s => s);
                } else if (Array.isArray(ignoredRaw)) {
                    ignoredPaths = ignoredRaw.map(String);
                }

                const script = generateReverseProxyBashScript(domain, proxyPath, proxyIp, proxyPort, ignoredPaths);
                return command.replace(reverseProxyRegex, script);
            }
            return command;
        };

        commandToExecute = processReverseProxyTag(commandToExecute, allFinalParams);

        let loggedCommand = bashCommand;
        const allParamsForLogging = { ...allFinalParams };
        confidentialParamKeys.forEach(key => {
            if (allParamsForLogging[key]) {
                allParamsForLogging[key] = '********';
            }
        });
        if (allParamsForLogging['universal.account_githubToken']) {
            allParamsForLogging['universal.account_githubToken'] = '********';
        }
        for (const [key, value] of Object.entries(allParamsForLogging)) {
            const placeholderRegex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
            loggedCommand = loggedCommand.replace(placeholderRegex, String(value));
        }

        loggedCommand = processReverseProxyTag(loggedCommand, allParamsForLogging);

        // This is the wrapper that handles swap file creation and cleanup
        const finalCommand = `
set -e
SWAP_FILE="/command_swapfile"

cleanup() {
    if [ -f "$SWAP_FILE" ]; then
        echo ""
        echo "--- Cleaning up temporary swap file ---"
        sudo swapoff "$SWAP_FILE" >/dev/null 2>&1
        sudo rm -f "$SWAP_FILE"
        echo "--- Swap file removed ---"
    fi
}
trap cleanup EXIT

echo "--- Creating 4GB temporary swap file ---"
sudo fallocate -l 4G "$SWAP_FILE"
sudo chmod 600 "$SWAP_FILE"
sudo mkswap "$SWAP_FILE"
sudo swapon "$SWAP_FILE"
echo "--- Swap file created and active ---"

get_available_port() {
    comm -23 <(seq 49152 65535 | sort) <(ss -tan | awk 'NR>1 {print $4}' | cut -d':' -f2 | sort -u) | shuf | head -n 1
}
APP_PORT=${allocatesPort ? "$(get_available_port)" : "''"}
export APP_PORT

echo ""
echo "--- EXECUTING COMMAND: ${commandName} ---"
cat <<'BASH_COMMAND_EOF' | sed "s/{{universal.app_port}}/$APP_PORT/g" | bash
${commandToExecute}
BASH_COMMAND_EOF
echo "--- COMMAND FINISHED ---"
echo ""
`;

        await updateServerLog(logId, { command: loggedCommand });

        const ssh = new NodeSSH();
        let finalOutput = '';
        let finalStatus: ServerLog['status'] = 'failed';

        try {
            await updateServerLog(logId, { status: 'ongoing', output: `Connecting to ${server.publicIp}...` });

            await ssh.connect({ host: server.publicIp, username: server.username || 'root', privateKey: server.privateKey });

            await updateServerLog(logId, { output: `Connection successful. Preparing to run command...` });

            const result = await ssh.execCommand(finalCommand, {
                onStdout: (chunk) => {
                    finalOutput += chunk.toString('utf8');
                    updateServerLog(logId, { output: finalOutput });
                },
                onStderr: (chunk) => {
                    finalOutput += chunk.toString('utf8');
                    updateServerLog(logId, { output: finalOutput });
                }
            });

            finalStatus = result.code === 0 ? 'completed' : 'failed';
            if (result.code !== 0) {
                finalOutput += `\n\n--- COMMAND FAILED ---\nExited with code: ${result.code}`;
            }

            await updateServerLog(logId, { status: finalStatus, output: finalOutput });

            // Execute next commands in the flow if this command succeeded
            let nextCommandResults: { commandId: string; success: boolean; logId?: string }[] = [];
            if (finalStatus === 'completed' && commandId) {
                const commandDetails = await getServerCommand(commandId);
                if (commandDetails.success && commandDetails.command?.nextCommands && commandDetails.command.nextCommands.length > 0) {
                    finalOutput += `\n\n--- EXECUTING COMMAND FLOW ---\n`;
                    await updateServerLog(logId, { output: finalOutput });

                    for (const nextCommandId of commandDetails.command.nextCommands) {
                        const nextCmdDetails = await getServerCommand(nextCommandId);
                        const nextCmdName = nextCmdDetails.success ? nextCmdDetails.command?.name : nextCommandId;

                        finalOutput += `\nTriggering next command: ${nextCmdName}...\n`;
                        await updateServerLog(logId, { output: finalOutput });

                        const nextResult = await runCommand(serverId, nextCommandId, processedParams);
                        nextCommandResults.push({
                            commandId: nextCommandId,
                            success: nextResult.success,
                            logId: nextResult.logId
                        });

                        if (nextResult.success) {
                            finalOutput += `✓ ${nextCmdName} completed successfully.\n`;
                        } else {
                            finalOutput += `✗ ${nextCmdName} failed: ${nextResult.error}\n`;
                        }
                        await updateServerLog(logId, { output: finalOutput });
                    }

                    finalOutput += `--- COMMAND FLOW COMPLETE ---\n`;
                    await updateServerLog(logId, { output: finalOutput });
                }
            }

            return { success: finalStatus === 'completed', logId, finalStatus, nextCommandResults };

        } catch (sshError: any) {
            finalOutput = `${finalOutput}\n\n--- SSH ERROR ---\n${sshError.message || String(sshError)}`;
            throw new Error(finalOutput);
        } finally {
            if (ssh.isConnected()) {
                ssh.dispose();
            }
            revalidatePath(`/root/servers/${serverId}`);
        }

    } catch (error: any) {
        await updateServerLog(logId, { status: 'failed', output: error.message });
        await logErrorToFirestore({ message: `Runner Error for server ${serverId}, log ${logId}:`, stack: error.stack, source: 'runCommand.main' });
        return { success: false, error: error.message, logId, finalStatus: 'failed' };
    }
}
