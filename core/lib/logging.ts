
'use server';

import { db } from '@/core/lib/db';
import type { LogErrorParams } from '@/schemas/logging';

export async function logErrorToDatabase(params: LogErrorParams): Promise<{ success: boolean, error?: string }> {
    try {
        await db.errorLog.create({
          data: {
            ...params,
            timestamp: new Date(),
          },
        });
        return { success: true };
    } catch (e: any) {
        console.error("CRITICAL: Failed to log error to database:", e);
        console.error("Original Error to be Logged:", params);
        return { success: false, error: e.message };
    }
}
