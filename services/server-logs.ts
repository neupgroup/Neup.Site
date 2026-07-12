

'use server';

import { prisma as db } from '@/core/database/prisma';
import type { ServerLog } from '@/services/server/type';
import { logErrorToDatabase } from '@/core/helpers/logger';

/**
 * Creates a new server log entry.
 */
export async function createServerLog(logData: Omit<ServerLog, 'id' | 'initiatedAt' | 'completedAt'>): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const record = await db.serverLog.create({
      data: {
        serverId: logData.serverId,
        commandId: logData.commandId ?? null,
        commandName: logData.commandName ?? null,
        command: logData.command,
        output: logData.output,
        status: logData.status,
        initiatedBy: logData.initiatedBy || 'system',
        initiatedAt: new Date(),
        completedAt: null,
      },
      select: { id: true },
    });
    return { success: true, id: record.id };
  } catch (e: any) {
    // Cannot log to Firestore here as it might cause an infinite loop if logging itself fails
    console.error("CRITICAL: Failed to create server log.", e);
    return { success: false, error: 'Failed to create server log.' };
  }
}

/**
 * Updates an existing server log entry.
 */
export async function updateServerLog(id: string, logData: Partial<Omit<ServerLog, 'id' | 'initiatedAt'>>): Promise<{ success: boolean; error?: string }> {
  try {
    const completedAt =
      logData.status === 'completed' || logData.status === 'failed' || logData.status === 'cancelled'
        ? new Date()
        : undefined;

    await db.serverLog.update({
      where: { id },
      data: {
        ...(logData.serverId !== undefined ? { serverId: logData.serverId } : {}),
        ...(logData.commandId !== undefined ? { commandId: logData.commandId ?? null } : {}),
        ...(logData.commandName !== undefined ? { commandName: logData.commandName ?? null } : {}),
        ...(logData.command !== undefined ? { command: logData.command } : {}),
        ...(logData.output !== undefined ? { output: logData.output } : {}),
        ...(logData.status !== undefined ? { status: logData.status } : {}),
        ...(logData.initiatedBy !== undefined ? { initiatedBy: logData.initiatedBy } : {}),
        ...(completedAt ? { completedAt } : {}),
      },
    });
    return { success: true };
  } catch (e: any) {
     // Cannot log to Firestore here as it might cause an infinite loop if logging itself fails
    console.error(`CRITICAL: Failed to update server log ${id}.`, e);
    // Don't return an error here, as this is often called in a non-critical path
    // and we don't want to stop the main flow for a logging error.
    return { success: false, error: e.message };
  }
}

/**
 * Fetches a single server log by its ID.
 */
export async function getServerLog(id: string): Promise<{ success: boolean; log?: ServerLog; error?: string }> {
    try {
        const record = await db.serverLog.findUnique({ where: { id } });
        if (!record) {
            return { success: false, error: 'Log not found.' };
        }
        const log: ServerLog = {
            id: record.id,
            serverId: record.serverId,
            command: record.command,
            commandId: record.commandId ?? undefined,
            commandName: record.commandName ?? undefined,
            output: record.output,
            status: record.status,
            initiatedBy: record.initiatedBy,
            initiatedAt: record.initiatedAt ? record.initiatedAt.toISOString() : null,
            completedAt: record.completedAt ? record.completedAt.toISOString() : null,
        };
        return { success: true, log };

    } catch (e: any) {
        // This action is used for polling, so logging to Firestore might be too noisy.
        // Console error is sufficient for developers to debug.
        console.error(`Failed to get server log ${id}:`, e);
        return { success: false, error: 'Failed to fetch log.' };
    }
}


/**
 * Fetches server logs with pagination.
 */
export async function getServerLogs({ serverId, page = 1, pageSize = 10 }: { serverId: string, page?: number, pageSize?: number }): Promise<{ logs?: ServerLog[], error?: string, hasMore?: boolean, success: boolean }> {
    try {
        const records = await db.serverLog.findMany({
          where: { serverId },
          orderBy: [{ initiatedAt: 'desc' }, { id: 'asc' }],
          skip: Math.max(0, page - 1) * pageSize,
          take: pageSize + 1,
        });

        const logs = records.slice(0, pageSize).map((record) => ({
          id: record.id,
          serverId: record.serverId,
          command: record.command,
          commandId: record.commandId ?? undefined,
          commandName: record.commandName ?? undefined,
          output: record.output,
          status: record.status,
          initiatedBy: record.initiatedBy,
          initiatedAt: record.initiatedAt ? record.initiatedAt.toISOString() : null,
          completedAt: record.completedAt ? record.completedAt.toISOString() : null,
        })) as ServerLog[];

        const hasMore = records.length > pageSize;
        
        return { logs, hasMore, success: true };

    } catch (e: any) {
        await logErrorToDatabase({ message: `Failed to fetch server logs for serverId: ${serverId}: ${e.message}`, stack: e.stack, source: 'getServerLogs' });
        return { error: 'Failed to load logs. Please check the error logs for more details.', success: false };
    }
}
