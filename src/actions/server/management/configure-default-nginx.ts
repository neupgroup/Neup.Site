
'use server';

import { runCommand } from '@/actions/runner';

export interface ConfigureDefaultNginxResult {
    success: boolean;
    error?: string;
    message?: string;
}

/**
 * Configures the default nginx configuration to redirect all traffic to neupgroup.com/cloud
 * This includes creating SSL certificates and setting up both HTTP and HTTPS redirects
 */
export async function configureDefaultNginx(serverId: string): Promise<ConfigureDefaultNginxResult> {
    try {
        const result = await runCommand(serverId, 'initial-server-setup', {}, 'Initial Server Setup');
        if (result.success) {
            return {
                success: true,
                message: 'Default nginx configuration successfully applied'
            };
        } else {
             return {
                success: false,
                error: 'Failed to configure nginx',
                message: result.error || 'Unknown error occurred while configuring nginx'
            };
        }
       
    } catch (error) {
        return {
            success: false,
            error: 'Unexpected error',
            message: error instanceof Error ? error.message : 'An unexpected error occurred'
        };
    }
}
