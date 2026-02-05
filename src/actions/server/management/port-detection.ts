'use server';

import { getPrivateServerDetails } from '@/actions/servers';
import { updateAllocationPort } from '@/actions/allocations';
import { NodeSSH } from 'node-ssh';
import { logErrorToFirestore } from '@/lib/logging';

export async function detectAndAppPortFromPm2(siteId: string, serverId: string): Promise<{ success: boolean; port?: number; error?: string }> {
    const ssh = new NodeSSH();

    try {
        const { server, error: serverError } = await getPrivateServerDetails(serverId);
        if (serverError || !server || !server.publicIp || !server.privateKey) {
            return { success: false, error: serverError || 'Server credentials not found.' };
        }

        await ssh.connect({
            host: server.publicIp,
            username: server.username || 'root',
            privateKey: server.privateKey
        });

        // Get PM2 list in JSON format
        const result = await ssh.execCommand('pm2 jlist');

        if (result.code !== 0) {
            return { success: false, error: 'Failed to retrieve PM2 list.' };
        }

        const processes = JSON.parse(result.stdout);
        const appProcess = processes.find((p: any) => p.name === siteId);

        if (!appProcess) {
            return { success: false, error: `PM2 process "${siteId}" not found.` };
        }

        // Try to find port in arguments
        // Args usually look like [ "start", "--", "-p", "3000" ] or spaces merged
        // We look for "-p" followed by a number
        let port: number | undefined;

        const args = appProcess.pm2_env?.args;
        if (Array.isArray(args)) {
            const argsStr = args.join(' ');
            const match = argsStr.match(/-p\s+(\d+)/);
            if (match) {
                port = parseInt(match[1], 10);
            }
        }

        if (!port && appProcess.pm2_env?.env?.PORT) {
            port = parseInt(appProcess.pm2_env.env.PORT, 10);
        }

        if (port) {
            await updateAllocationPort(siteId, serverId, port);
            return { success: true, port };
        }

        return { success: false, error: 'Port could not be detected from PM2 configuration.' };

    } catch (e: any) {
        console.error('Port detection error:', e);
        await logErrorToFirestore({ message: `Port detection failed for ${siteId}: ${e.message}`, stack: e.stack, source: 'detectAndAppPortFromPm2' });
        return { success: false, error: e.message };
    } finally {
        ssh.dispose();
    }
}
