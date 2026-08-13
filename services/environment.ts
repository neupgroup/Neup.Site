

'use server';

import { prisma as db } from '@/core/database/prisma';
import { logErrorToDatabase } from '@/logica.logger';
import { getAccountId } from './accounts';
import { revalidatePath } from 'next/cache';
import type { EnvironmentVariable } from '@/services/environment/type';
import { cookies } from 'next/headers';
import { markEnvironmentsAsPending } from './structure';


export async function createEnvironmentVariable(data: Omit<EnvironmentVariable, 'id' | 'assetId' | 'createdBy' | 'createdOn'>): Promise<{ success: boolean; id?: string; error?: string }> {
  const accountId = await getAccountId();
  const assetId = (await cookies()).get('assetId')?.value;

  if (!accountId || !assetId) {
    return { success: false, error: 'User or site context not found.' };
  }

  try {
    const record = await db.environmentVariable.create({
      data: {
        assetId,
        name: data.name,
        value: data.value,
        dataType: data.dataType,
        isPrivate: data.isPrivate ?? false,
        createdBy: accountId,
        createdOn: new Date(),
      },
      select: { id: true },
    });

    await markEnvironmentsAsPending(assetId);

    revalidatePath('/site/environment');
    return { success: true, id: record.id };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to create environment variable: ${e.message}`, stack: e.stack, source: 'createEnvironmentVariable' });
    return { success: false, error: 'Failed to create environment variable.' };
  }
}

export async function getEnvironmentVariables({ page = 1, pageSize = 10 }: { page?: number; pageSize?: number } = {}): Promise<{ success: boolean; variables?: EnvironmentVariable[]; error?: string; totalCount?: number }> {
  const assetId = (await cookies()).get('assetId')?.value;
  if (!assetId) {
    return { success: false, error: 'Asset context not found.' };
  }

  try {
    const totalCount = await db.environmentVariable.count({ where: { assetId } });
    const records = await db.environmentVariable.findMany({
      where: { assetId },
      orderBy: [{ createdOn: 'desc' }, { id: 'asc' }],
      skip: Math.max(0, page - 1) * pageSize,
      take: pageSize,
    });
    const variables = records.map((record) => ({
      id: record.id,
      assetId: record.assetId,
      name: record.name,
      value: record.value,
      dataType: record.dataType,
      isPrivate: record.isPrivate,
      createdBy: record.createdBy,
      createdOn: record.createdOn ? record.createdOn.toISOString() : null,
    })) as EnvironmentVariable[];
    return { success: true, variables, totalCount };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to get environment variables: ${e.message}`, stack: e.stack, source: 'getEnvironmentVariables' });
    return { success: false, error: 'Failed to fetch environment variables.' };
  }
}

export async function deleteEnvironmentVariable(id: string): Promise<{ success: boolean; error?: string }> {
  const assetId = (await cookies()).get('assetId')?.value;
  if (!assetId) {
    return { success: false, error: 'Asset context not found.' };
  }

  try {
    const result = await db.environmentVariable.deleteMany({ where: { id, assetId } });
    if (result.count === 0) {
      return { success: false, error: 'Environment variable not found.' };
    }
    await markEnvironmentsAsPending(assetId);
    revalidatePath('/site/environment');
    return { success: true };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to delete environment variable ${id}: ${e.message}`, stack: e.stack, source: 'deleteEnvironmentVariable' });
    return { success: false, error: 'Failed to delete environment variable.' };
  }
}
