/*
::neup.documentation::sites-logica-logger-bridge
::title Sites Logica Logger Bridge

::public

Use `logErrorToDatabase()` for error logging and `logInfo()` for structured
application info logs. Both functions delegate to `@/logica/logger`.

::public end

::private

This bridge keeps application code on one import path while routing the actual
logging transport through the Logica logger client.

::private end

::end
*/

import { logger } from '@/logica/logger';

export interface LogErrorParams {
  message: string;
  stack?: string;
  componentStack?: string;
  source?: string;
  details?: string;
}

export interface LogInfoParams {
  message: string;
  source?: string;
  details?: string;
  data?: Record<string, unknown>;
  type?: string;
}

function compactRecord(entries: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(entries).filter(([, value]) => value !== undefined && value !== ''),
  );
}

export async function logErrorToDatabase(params: LogErrorParams) {
  const payload = compactRecord({
    message: params.message,
    stack: params.stack,
    componentStack: params.componentStack,
    source: params.source,
    details: params.details,
  });

  try {
    return await logger.error(payload);
  } catch (loggingError) {
    console.error('Failed to send error log via Logica logger.', {
      payload,
      loggingError,
    });

    return null;
  }
}

export async function logInfo(params: LogInfoParams) {
  const payload = compactRecord({
    message: params.message,
    source: params.source,
    details: params.details,
    ...(params.data ?? {}),
  });

  try {
    return await logger.type(params.type ?? 'info').log(payload);
  } catch (loggingError) {
    console.error('Failed to send info log via Logica logger.', {
      payload,
      loggingError,
    });

    return null;
  }
}

export const appLogger = {
  error: logErrorToDatabase,
  info: logInfo,
};

export default appLogger;
