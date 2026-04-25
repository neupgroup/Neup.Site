
'use server';

import { db } from '@/core/lib/db';

export interface ErrorLog {
    id: string;
    message: string;
    stack?: string;
    source?: string;
    timestamp: string;
}

export async function getErrorLogsAction({ page = 1, pageSize = 10 }: { page?: number, pageSize?: number }): Promise<{ logs?: ErrorLog[], error?: string, totalCount?: number }> {
    try {
        const totalCount = await db.errorLog.count();
        const records = await db.errorLog.findMany({
          orderBy: [{ timestamp: 'desc' }, { id: 'asc' }],
          skip: Math.max(0, page - 1) * pageSize,
          take: pageSize,
        });

        const logs = records.map((record) => ({
          id: record.id,
          message: record.message,
          stack: record.stack ?? undefined,
          source: record.source ?? undefined,
          timestamp: record.timestamp.toISOString(),
        })) as ErrorLog[];
        return { logs, totalCount };
    } catch (e: any) {
        console.error('Failed to fetch error logs:', e);
        return { error: e.message || 'Unknown error occurred while fetching logs.' };
    }
}

export async function getErrorLogById(id: string): Promise<{ log?: ErrorLog, error?: string }> {
    try {
        const record = await db.errorLog.findUnique({ where: { id } });
        if (!record) {
            return { error: 'Error log not found.' };
        }

        const log: ErrorLog = {
            id: record.id,
            message: record.message,
            stack: record.stack ?? undefined,
            source: record.source ?? undefined,
            timestamp: record.timestamp.toISOString(),
        };

        return { log };
    } catch (e: any) {
        console.error(`Failed to fetch error log with ID ${id}:`, e);
        return { error: e.message || `Unknown error occurred while fetching log ${id}.` };
    }
}
