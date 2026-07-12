
'use server';

import { prisma as db } from '@/core/database/prisma';
import { revalidatePath } from 'next/cache';
import type { Allocation } from '@/services/server/allocation/type';
import { logErrorToDatabase } from '@/core/helpers/logger';

export async function createAllocation(data: Omit<Allocation, 'id' | 'allocatedOn' | 'status'>): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const record = await db.allocation.create({
      data: {
        serverId: data.serverId,
        assetId: data.assetId,
        port: data.port,
        allocatedStorage: data.allocatedStorage,
        allocatedOn: new Date(),
        status: 'active',
      },
      select: { id: true },
    });
    revalidatePath('/root/servers/allocations');
    return { success: true, id: record.id };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to create allocation: ${e.message}`, stack: e.stack, source: 'createAllocation' });
    return { success: false, error: 'Failed to create allocation.' };
  }
}

export async function getAllocations(): Promise<{ success: boolean; allocations?: Allocation[]; error?: string }> {
  try {
    const records = await db.allocation.findMany({
      orderBy: [{ allocatedOn: 'desc' }, { id: 'asc' }],
      select: {
        id: true,
        serverId: true,
        assetId: true,
        port: true,
        allocatedStorage: true,
        allocatedOn: true,
        status: true,
      },
    });
    const allocations = records.map((record) => ({
      id: record.id,
      serverId: record.serverId,
      assetId: record.assetId,
      port: record.port ?? 0,
      allocatedStorage: record.allocatedStorage ?? 0,
      allocatedOn: record.allocatedOn ? record.allocatedOn.toISOString() : null,
      status: (record.status as Allocation['status']) || 'active',
    })) as Allocation[];
    return { success: true, allocations };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to get allocations: ${e.message}`, stack: e.stack, source: 'getAllocations' });
    return { success: false, error: 'Failed to fetch allocations.' };
  }
}

export async function getAllocation(id: string): Promise<{ success: boolean; allocation?: Allocation; error?: string }> {
  try {
    const record = await db.allocation.findUnique({
      where: { id },
      select: {
        id: true,
        serverId: true,
        assetId: true,
        port: true,
        allocatedStorage: true,
        allocatedOn: true,
        status: true,
      },
    });
    if (!record) {
      return { success: false, error: 'Allocation not found.' };
    }

    const allocation: Allocation = {
      id: record.id,
      serverId: record.serverId,
      assetId: record.assetId,
      port: record.port ?? 0,
      allocatedStorage: record.allocatedStorage ?? 0,
      allocatedOn: record.allocatedOn ? record.allocatedOn.toISOString() : null,
      status: (record.status as Allocation['status']) || 'active',
    };
    return { success: true, allocation };

  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to get allocation ${id}: ${e.message}`, stack: e.stack, source: 'getAllocation' });
    return { success: false, error: 'Failed to fetch allocation.' };
  }
}

export async function updateAllocation(id: string, data: Partial<Omit<Allocation, 'id' | 'allocatedOn'>>): Promise<{ success: boolean; error?: string }> {
  try {
    await db.allocation.update({
      where: { id },
      data: {
        ...(data.serverId !== undefined ? { serverId: data.serverId } : {}),
        ...(data.assetId !== undefined ? { assetId: data.assetId } : {}),
        ...(data.port !== undefined ? { port: data.port } : {}),
        ...(data.allocatedStorage !== undefined ? { allocatedStorage: data.allocatedStorage } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
      },
    });
    revalidatePath('/root/servers/allocations');
    revalidatePath(`/root/servers/allocations/${id}`);
    return { success: true };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to update allocation ${id}: ${e.message}`, stack: e.stack, source: 'updateAllocation' });
    return { success: false, error: 'Failed to update allocation.' };
  }
}

export async function deleteAllocation(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await db.allocation.delete({ where: { id } });
    revalidatePath('/root/servers/allocations');
    return { success: true };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to delete allocation ${id}: ${e.message}`, stack: e.stack, source: 'deleteAllocation' });
    return { success: false, error: 'Failed to delete allocation.' };
  }
}

export async function updateAllocationPort(assetId: string, serverId: string, port: number): Promise<{ success: boolean; error?: string }> {
  try {
    const allocation = await db.allocation.findFirst({
      where: { assetId, serverId },
      orderBy: [{ allocatedOn: 'desc' }, { id: 'asc' }],
      select: { id: true },
    });
    if (!allocation) {
      return { success: false, error: 'Allocation not found for this site and server.' };
    }
    await db.allocation.update({ where: { id: allocation.id }, data: { port } });

    revalidatePath('/root/servers/allocations');
    revalidatePath('/settings/info');

    return { success: true };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to update allocation port for site ${assetId}: ${e.message}`, stack: e.stack, source: 'updateAllocationPort' });
    return { success: false, error: 'Failed to update allocation port.' };
  }
}
