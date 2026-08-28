'use server';

import { resolveAppPath } from './server-paths';
import { readFileContent } from './read-file-content';
import { saveFileContent } from './save-file-content';
import { logger } from '#/logica/logger';

export interface DeploymentStepStatus {
    status: 'pending' | 'success' | 'failure' | 'loading' | 'warning' | 'built' | 'notBuilt' | 'building';
    recordedAt: string;
    description?: string;
    // Specific fields
    exists?: boolean;
    statusCode?: number;
    changesMade?: boolean;
}

export interface AppStatus {
    applicationExists: DeploymentStepStatus;
    applicationBuilt: DeploymentStepStatus;
    proxyConfigured: DeploymentStepStatus;
    websiteLive: DeploymentStepStatus;
}

const STATUS_FILENAME = 'status.json';

export async function getAppStatus(serverId: string): Promise<{ success: boolean; status?: AppStatus; error?: string }> {
    try {
        const { resolvedPath, error } = await resolveAppPath(serverId);
        if (error) return { success: false, error };

        const filePath = `${resolvedPath}/${STATUS_FILENAME}`;
        const { content, error: readError } = await readFileContent(serverId, filePath);

        if (readError || !content) {
            return { success: false, error: 'Status file not found.' };
        }

        try {
            const status = JSON.parse(content) as AppStatus;
            return { success: true, status };
        } catch (jsonError) {
            return { success: false, error: 'Failed to parse status file.' };
        }

    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function updateAppStatus(serverId: string, partialStatus: Partial<AppStatus>): Promise<{ success: boolean; error?: string }> {
    try {
        const { resolvedPath, error } = await resolveAppPath(serverId);
        if (error) return { success: false, error };

        const filePath = `${resolvedPath}/${STATUS_FILENAME}`;

        // Get existing status first to merge
        // We ignore error here because if it doesn't exist, we create a new one
        const output = await getAppStatus(serverId);
        const existingStatus = output.success ? output.status : null;

        const newStatus: AppStatus = {
            applicationExists: existingStatus?.applicationExists || { status: 'pending', recordedAt: new Date().toISOString() },
            applicationBuilt: existingStatus?.applicationBuilt || { status: 'notBuilt', recordedAt: new Date().toISOString() },
            proxyConfigured: existingStatus?.proxyConfigured || { status: 'pending', recordedAt: new Date().toISOString() },
            websiteLive: existingStatus?.websiteLive || { status: 'pending', recordedAt: new Date().toISOString() },
            ...partialStatus
        };

        const content = JSON.stringify(newStatus, null, 2);
        const saveResult = await saveFileContent(serverId, filePath, content);

        return saveResult;

    } catch (e: any) {
        await logger.error({ message: `Failed to update status: ${e.message}`, source: 'updateAppStatus', stack: e.stack });
        return { success: false, error: e.message };
    }
}
