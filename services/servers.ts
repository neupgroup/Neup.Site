

'use server';

import { Server, ServerAllocation } from '@/services/server/type';
import { cookies } from 'next/headers';
import { logErrorToDatabase } from '@/logica.logger';
import { prisma as db } from '@/core/database/prisma';

/**
 * Creates a new server.
 */
export async function createServer(serverData: Omit<Server, 'id' | 'createdOn' | 'expiresOn'>) {
  try {
    const record = await db.server.create({
      data: {
        name: serverData.name,
        publicIp: serverData.publicIp,
        privateIp: serverData.privateIp ?? null,
        privateKey: serverData.privateKey ?? null,
        serverType: serverData.serverType ?? null,
        platform: serverData.platform ?? null,
        provider: serverData.provider ?? null,
        isPrivate: serverData.isPrivate ?? null,
        username: serverData.username ?? null,
        basePath: serverData.basePath ?? null,
        appPath: serverData.appPath ?? null,
        storageUsed: serverData.storageUsed ?? null,
        storageTotal: serverData.storageTotal ?? null,
        storageUnit: serverData.storageUnit ?? null,
        portsOpen: serverData.portsOpen ? (serverData.portsOpen as any) : undefined,
        serverConfigured: false,
        defaultNginxConfigStatus: serverData.defaultNginxConfigStatus ?? null,
        createdOn: new Date(),
        expiresOn: null,
      },
      select: { id: true },
    });
    return { success: true, id: record.id };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to create server: ${e.message}`, stack: e.stack, source: 'createServer' });
    return { success: false, error: 'Failed to create server.' };
  }
}

/**
 * Fetches all servers, excluding private fields.
 */
export async function getServers(): Promise<{ success: boolean; servers?: Server[]; error?: string }> {
  try {
    const records = await db.server.findMany({
      orderBy: [{ createdOn: 'desc' }, { id: 'asc' }],
    });
    const servers = records.map((record) => ({
      id: record.id,
      name: record.name,
      publicIp: record.publicIp,
      serverType: (record.serverType as Server['serverType']) ?? undefined,
      platform: (record.platform as Server['platform']) ?? undefined,
      provider: record.provider ?? undefined,
      isPrivate: record.isPrivate ?? undefined,
      username: record.username ?? undefined,
      basePath: record.basePath ?? undefined,
      appPath: record.appPath ?? undefined,
      storageUsed: record.storageUsed ?? undefined,
      storageTotal: record.storageTotal ?? undefined,
      storageUnit: record.storageUnit ?? undefined,
      portsOpen: (record.portsOpen as any) ?? undefined,
      serverConfigured: record.serverConfigured ?? false,
      defaultNginxConfigStatus: (record.defaultNginxConfigStatus as any) ?? undefined,
      createdOn: record.createdOn ? record.createdOn.toISOString() : null,
      expiresOn: record.expiresOn ? record.expiresOn.toISOString() : null,
    })) as Server[];
    return { success: true, servers };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to get servers: ${e.message}`, stack: e.stack, source: 'getServers' });
    return { success: false, error: 'Failed to fetch servers.' };
  }
}

/**
 * Fetches servers relevant to the current assetId by checking the serverAllocations collection.
 */
export async function getSiteServers(): Promise<{ success: boolean; servers?: (Server & { allocation: ServerAllocation })[]; error?: string }> {
  const cookieStore = await cookies();
  const assetId = cookieStore.get('assetId')?.value;
  if (!assetId) return { success: false, error: 'Asset ID not found.' };

  try {
    const allocations = await db.allocation.findMany({
      where: { assetId },
      orderBy: [{ allocatedOn: 'desc' }, { id: 'asc' }],
      include: { server: true },
    });
    const servers = allocations
      .map((allocation) => {
        const server = allocation.server;
        if (!server) return null;

        const serverInfo: Server = {
          id: server.id,
          name: server.name,
          publicIp: server.publicIp,
          serverConfigured: server.serverConfigured ?? false,
          createdOn: server.createdOn ? server.createdOn.toISOString() : null,
        };

        const allocationInfo: ServerAllocation = {
          id: allocation.id,
          assetId: allocation.assetId,
          serverId: allocation.serverId,
          username: allocation.username ?? undefined,
          deploymentPath: allocation.deploymentPath ?? undefined,
          storageAllocation: allocation.storageAllocation ?? '',
          port: allocation.port ?? undefined,
          allocatedOn: allocation.allocatedOn ? allocation.allocatedOn.toISOString() : null,
        };

        return { ...serverInfo, allocation: allocationInfo };
      })
      .filter(Boolean) as (Server & { allocation: ServerAllocation })[];

    return { success: true, servers };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to get site servers: ${e.message}`, stack: e.stack, source: 'getSiteServers' });
    return { success: false, error: 'Failed to fetch site-specific servers.' };
  }
}


/**
 * Fetches a single server by its ID, excluding private fields.
 */
export async function getServer(id: string): Promise<{ success: boolean, server?: Server, error?: string }> {
  try {
    const record = await db.server.findUnique({ where: { id } });
    if (!record) {
      return { success: false, error: 'Server not found or unauthorized.' };
    }

    // Exclude privateIp and privateKey for security
    const server: Server = {
      id: record.id,
      name: record.name,
      publicIp: record.publicIp,
      privateIp: record.privateIp ?? undefined,
      serverType: (record.serverType as Server['serverType']) ?? undefined,
      platform: (record.platform as Server['platform']) ?? undefined,
      provider: record.provider ?? undefined,
      isPrivate: record.isPrivate ?? undefined,
      username: record.username ?? undefined,
      basePath: record.basePath ?? undefined,
      appPath: record.appPath ?? undefined,
      serverConfigured: record.serverConfigured ?? false,
      createdOn: record.createdOn ? record.createdOn.toISOString() : null,
      expiresOn: record.expiresOn ? record.expiresOn.toISOString() : null,
    };
    return { success: true, server };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to get server ${id}: ${e.message}`, stack: e.stack, source: 'getServer' });
    return { success: false, error: 'Failed to fetch server.' };
  }
}

/**
 * Fetches a single server by its ID, including private fields.
 * This should only be used in server-side actions where credentials are required.
 */
export async function getPrivateServerDetails(id: string): Promise<{ success: boolean, server?: Server, error?: string }> {
  try {
    const record = await db.server.findUnique({ where: { id } });
    if (!record) {
      return { success: false, error: 'Server not found.' };
    }

    const server: Server = {
      id: record.id,
      name: record.name,
      publicIp: record.publicIp,
      privateIp: record.privateIp ?? undefined,
      privateKey: record.privateKey ?? undefined,
      serverType: (record.serverType as Server['serverType']) ?? undefined,
      platform: (record.platform as Server['platform']) ?? undefined,
      provider: record.provider ?? undefined,
      isPrivate: record.isPrivate ?? undefined,
      username: record.username ?? undefined,
      basePath: record.basePath ?? undefined,
      appPath: record.appPath ?? undefined,
      serverConfigured: record.serverConfigured ?? false,
      createdOn: record.createdOn ? record.createdOn.toISOString() : null,
      expiresOn: record.expiresOn ? record.expiresOn.toISOString() : null,
    };
    return { success: true, server };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to get private server details for ${id}: ${e.message}`, stack: e.stack, source: 'getPrivateServerDetails' });
    return { success: false, error: 'Failed to fetch server details.' };
  }
}

/**
 * Updates a server. Allows overriding privateKey and privateIp without fetching them.
 */
export async function updateServer(id: string, serverData: Partial<Omit<Server, 'id' | 'createdOn'>>) {
  try {
    const dataToUpdate: Record<string, any> = {
      ...(serverData.name !== undefined ? { name: serverData.name } : {}),
      ...(serverData.publicIp !== undefined ? { publicIp: serverData.publicIp } : {}),
      ...(serverData.serverType !== undefined ? { serverType: serverData.serverType ?? null } : {}),
      ...(serverData.platform !== undefined ? { platform: serverData.platform ?? null } : {}),
      ...(serverData.provider !== undefined ? { provider: serverData.provider ?? null } : {}),
      ...(serverData.isPrivate !== undefined ? { isPrivate: serverData.isPrivate ?? null } : {}),
      ...(serverData.username !== undefined ? { username: serverData.username ?? null } : {}),
      ...(serverData.basePath !== undefined ? { basePath: serverData.basePath ?? null } : {}),
      ...(serverData.appPath !== undefined ? { appPath: serverData.appPath ?? null } : {}),
      ...(serverData.storageUsed !== undefined ? { storageUsed: serverData.storageUsed ?? null } : {}),
      ...(serverData.storageTotal !== undefined ? { storageTotal: serverData.storageTotal ?? null } : {}),
      ...(serverData.storageUnit !== undefined ? { storageUnit: serverData.storageUnit ?? null } : {}),
      ...(serverData.portsOpen !== undefined ? { portsOpen: (serverData.portsOpen as any) ?? null } : {}),
      ...(serverData.serverConfigured !== undefined ? { serverConfigured: Boolean(serverData.serverConfigured) } : {}),
      ...(serverData.defaultNginxConfigStatus !== undefined
        ? { defaultNginxConfigStatus: (serverData.defaultNginxConfigStatus as any) ?? null }
        : {}),
      ...(serverData.expiresOn !== undefined ? { expiresOn: serverData.expiresOn ? new Date(serverData.expiresOn) : null } : {}),
    };

    // Only include private fields if explicitly provided and non-empty.
    if (typeof serverData.privateIp === 'string' && serverData.privateIp.trim()) {
      dataToUpdate.privateIp = serverData.privateIp.trim();
    }
    if (typeof serverData.privateKey === 'string' && serverData.privateKey.trim()) {
      dataToUpdate.privateKey = serverData.privateKey;
    }

    await db.server.update({ where: { id }, data: dataToUpdate });
    return { success: true, id };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to update server ${id}: ${e.message}`, stack: e.stack, source: 'updateServer' });
    return { success: false, error: `Failed to update server ${id}.` };
  }
}

/**
 * Deletes a server.
 */
export async function deleteServer(id: string) {
  try {
    await db.server.delete({ where: { id } });
    return { success: true };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to delete server ${id}: ${e.message}`, stack: e.stack, source: 'deleteServer' });
    return { success: false, error: 'Failed to delete server.' };
  }
}
