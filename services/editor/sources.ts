
'use server';

import { getActiveProjectId } from '@/services/projects';
import { prisma as db } from '@/core/database/prisma';
import { logger } from '@/logica/logger';

export type SourceType = 'api' | 'database' | 'static' | 'datalist';

export interface SourceMethod {
  methodName: string;
  path: string;
  httpMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
}

export interface BaseSource {
  id: string;
  assetId: string;
  name: string;
  type: SourceType;
  createdAt?: string | null;
  methods: SourceMethod[];
}

export interface ApiSource extends BaseSource { type: 'api'; url: string; headers?: Record<string, string>; }
export interface DatabaseSource extends BaseSource { type: 'database'; connection: string; }
export interface StaticSource extends BaseSource { type: 'static'; data: Record<string, any>; }
export interface DatalistSource extends BaseSource { type: 'datalist'; datalistId: string; }
export type Source = ApiSource | DatabaseSource | StaticSource | DatalistSource;

function toSource(r: any): Source {
  return {
    id: r.id,
    assetId: r.assetId,
    name: r.name,
    type: r.type as SourceType,
    methods: r.methods || [],
    url: r.url ?? undefined,
    headers: r.headers ?? undefined,
    connection: r.connection ?? undefined,
    data: r.data ?? undefined,
    datalistId: r.datalistId ?? undefined,
    createdAt: r.createdAt ? r.createdAt.toISOString() : null,
  } as Source;
}

export async function createSource(sourceData: Omit<Source, 'id' | 'createdAt' | 'assetId'>) {
  const assetId = await getActiveProjectId();
  if (!assetId) return { success: false, error: 'Asset ID not found.' };

  try {
    const record = await db.dataSource.create({
      data: { assetId, name: sourceData.name, type: sourceData.type, methods: sourceData.methods as any, createdAt: new Date() },
      select: { id: true },
    });
    return { success: true, id: record.id };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create source.' };
  }
}

export async function getSources(): Promise<{ success: boolean; sources?: Source[]; error?: string }> {
  const assetId = await getActiveProjectId();
  if (!assetId) return { success: false, error: 'Asset ID not found.' };

  try {
    const records = await db.dataSource.findMany({ where: { assetId } });
    return { success: true, sources: records.map(toSource) };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch sources.' };
  }
}

export async function getSource(id: string): Promise<{ success: boolean, source?: Source, error?: string }> {
  const assetId = await getActiveProjectId();
  if (!assetId) return { success: false, error: 'Asset ID not found.' };

  try {
    const record = await db.dataSource.findFirst({ where: { id, assetId } });
    if (!record) return { success: false, error: 'Source not found.' };
    return { success: true, source: toSource(record) };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch source.' };
  }
}

export async function updateSource(id: string, sourceData: Partial<Omit<Source, 'id' | 'createdAt' | 'assetId'>>) {
  const assetId = await getActiveProjectId();
  if (!assetId) return { success: false, error: 'Asset ID not found.' };

  try {
    const existing = await db.dataSource.findFirst({ where: { id, assetId } });
    if (!existing) return { success: false, error: 'Unauthorized' };
    await db.dataSource.update({ where: { id }, data: sourceData as any });
    return { success: true, id };
  } catch (error: any) {
    return { success: false, error: error.message || `Failed to update source ${id}.` };
  }
}

export async function deleteSource(id: string) {
  const assetId = await getActiveProjectId();
  if (!assetId) return { success: false, error: 'Asset ID not found.' };

  try {
    const existing = await db.dataSource.findFirst({ where: { id, assetId } });
    if (!existing) return { success: false, error: 'Unauthorized' };
    await db.dataSource.delete({ where: { id } });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete source.' };
  }
}

export async function testApiMethod(sourceId: string, method: SourceMethod, params: Record<string, string>): Promise<{ success: boolean; data?: any; error?: string }> {
  const { success, source, error } = await getSource(sourceId);
  if (!success || !source) return { success: false, error: `Failed to find source: ${error}` };
  if (source.type !== 'api') return { success: false, error: 'This action is only valid for API sources.' };

  let endpoint = method.path;
  for (const key in params) endpoint = endpoint.replace(`[${key}]`, encodeURIComponent(params[key]));

  const fullUrl = `${(source as ApiSource).url}${endpoint}`;
  const headers = { ...(source as ApiSource).headers, ...(method.headers || {}), 'Content-Type': 'application/json' };

  try {
    const response = await fetch(fullUrl, { method: method.httpMethod || 'GET', headers });
    if (!response.ok) throw new Error(`API returned status ${response.status}: ${await response.text()}`);
    return { success: true, data: await response.json() };
  } catch (e: any) {
    await logger.error({ message: `API Test Failed for ${fullUrl}: ${e.message}`, source: 'testApiMethod', details: JSON.stringify({ sourceId, method, params }) });
    return { success: false, error: e.message };
  }
}
