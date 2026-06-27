'use server';

import { db } from '@/core/lib/db';
import { revalidatePath } from 'next/cache';
import type { Redirect } from '@/schemas/redirect';
import { logErrorToDatabase } from '@/core/lib/logging';
import { getAccountId } from '@/services/accounts';
import { cookies } from 'next/headers';
import { markRedirectsAsPending } from './structure';
import { createServerLog, updateServerLog } from '@/services/server-logs';
import { NodeSSH } from 'node-ssh';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

export async function createRedirect(data: Omit<Redirect, 'id' | 'assetId' | 'created_by' | 'created_on'>): Promise<{ success: boolean; id?: string; error?: string }> {
  const accountId = await getAccountId();
  const assetId = (await cookies()).get('assetId')?.value;

  if (!accountId || !assetId) {
    return { success: false, error: 'User or site context not found.' };
  }

  try {
    const record = await db.redirect.create({
      data: {
        assetId,
        from: data.from,
        to: data.to,
        type: data.type,
        created_by: accountId,
        created_on: new Date(),
      },
      select: { id: true },
    });

    await markRedirectsAsPending(assetId);

    revalidatePath('/manage/redirects');
    return { success: true, id: record.id };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to create redirect: ${e.message}`, stack: e.stack, source: 'createRedirect' });
    return { success: false, error: 'Failed to create redirect.' };
  }
}

export async function getRedirects({ page = 1, pageSize = 10 }: { page?: number; pageSize?: number }): Promise<{ success: boolean; redirects?: Redirect[]; error?: string; totalCount?: number }> {
  const assetId = (await cookies()).get('assetId')?.value;
  if (!assetId) {
    return { success: false, error: 'Asset context not found.' };
  }

  try {
    const totalCount = await db.redirect.count({ where: { assetId } });
    const records = await db.redirect.findMany({
      where: { assetId },
      orderBy: [{ created_on: 'desc' }, { id: 'asc' }],
      skip: Math.max(0, page - 1) * pageSize,
      take: pageSize,
    });

    const redirects = records.map((record) => ({
      id: record.id,
      assetId: record.assetId,
      from: record.from,
      to: record.to,
      type: record.type,
      created_by: record.created_by,
      created_on: record.created_on ? record.created_on.toISOString() : null,
    })) as Redirect[];
    return { success: true, redirects, totalCount };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to get redirects: ${e.message}`, stack: e.stack, source: 'getRedirects' });
    return { success: false, error: 'Failed to fetch redirects.' };
  }
}

export async function deleteRedirect(id: string): Promise<{ success: boolean; error?: string }> {
  const assetId = (await cookies()).get('assetId')?.value;
  if (!assetId) {
    return { success: false, error: 'Asset context not found.' };
  }

  try {
    const result = await db.redirect.deleteMany({ where: { id, assetId } });
    if (result.count === 0) {
      return { success: false, error: 'Redirect not found.' };
    }

    await markRedirectsAsPending(assetId);

    revalidatePath('/manage/redirects');
    return { success: true };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to delete redirect ${id}: ${e.message}`, stack: e.stack, source: 'deleteRedirect' });
    return { success: false, error: 'Failed to delete redirect.' };
  }
}

export async function getAllRedirects(): Promise<{ success: boolean; redirects?: Redirect[]; error?: string }> {
  const assetId = (await cookies()).get('assetId')?.value;
  if (!assetId) {
    return { success: false, error: 'Asset context not found.' };
  }

  try {
    const records = await db.redirect.findMany({
      where: { assetId },
      orderBy: [{ created_on: 'desc' }, { id: 'asc' }],
    });
    const redirects = records.map((record) => ({
      id: record.id,
      assetId: record.assetId,
      from: record.from,
      to: record.to,
      type: record.type,
      created_by: record.created_by,
      created_on: record.created_on ? record.created_on.toISOString() : null,
    })) as Redirect[];
    return { success: true, redirects };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to get all redirects: ${e.message}`, stack: e.stack, source: 'getAllRedirects' });
    return { success: false, error: 'Failed to fetch redirects.' };
  }
}

export async function deployRedirects(): Promise<{ success: boolean; error?: string }> {
  const assetId = (await cookies()).get('assetId')?.value;
  if (!assetId) {
    return { success: false, error: 'Asset context not found.' };
  }

  let logId: string | undefined;

  try {
    const allocation = await db.allocation.findFirst({
      where: { assetId },
      orderBy: [{ allocatedOn: 'desc' }, { id: 'asc' }],
    });

    if (!allocation) {
      return { success: false, error: 'No server allocated for this site.' };
    }

    const serverId = allocation.serverId;

    const { server, error } = await getPrivateServerDetails(serverId);
    if (error || !server || !server.publicIp || !server.privateKey) {
      return { success: false, error: error || 'Server details not found' };
    }

    const logResult = await createServerLog({
      serverId: serverId,
      commandName: 'Deploy Redirects',
      command: 'Uploading redirects to server...',
      output: 'Starting redirects deployment...',
      status: 'pending',
      initiatedBy: 'system'
    });

    if (logResult.success && logResult.id) {
      logId = logResult.id;
    }

    const username = server.username || 'root';
    const resolvedAppPath = `/home/${username}/${assetId}`;
    const coreDir = `${resolvedAppPath}/base/core`;

    const ssh = new NodeSSH();
    let outputLog = `Connecting to ${server.publicIp}...\n`;
    if (logId) await updateServerLog(logId, { status: 'ongoing', output: outputLog });

    try {
      await ssh.connect({
        host: server.publicIp,
        username: server.username || 'root',
        privateKey: server.privateKey
      });

      outputLog += `Connected.\n`;
      if (logId) await updateServerLog(logId, { output: outputLog });

      await ssh.execCommand(`mkdir -p ${coreDir}`);

      const redirectsResult = await getAllRedirects();
      const redirects = redirectsResult.success ? redirectsResult.redirects : [];

      const tempBaseDir = await fs.mkdtemp(path.join(os.tmpdir(), 'redirects-'));
      const localCoreDir = path.join(tempBaseDir, 'core');
      await fs.mkdir(localCoreDir, { recursive: true });

      await fs.writeFile(path.join(localCoreDir, 'redirects.json'), JSON.stringify(redirects || [], null, 2));

      outputLog += `Uploading redirects.json to ${coreDir}...\n`;
      if (logId) await updateServerLog(logId, { output: outputLog });

      await ssh.putDirectory(localCoreDir, coreDir, { recursive: true, concurrency: 1 });
      
      outputLog += `Redirects uploaded successfully.\n`;
      if (logId) await updateServerLog(logId, { status: 'completed', output: outputLog });

      await fs.rm(tempBaseDir, { recursive: true, force: true });

    } catch (sshError: any) {
      const errMsg = outputLog + `\n\n--- FAILED ---\n${sshError.message}`;
      if (logId) await updateServerLog(logId, { status: 'failed', output: errMsg });
      throw new Error(errMsg);
    } finally {
      ssh.dispose();
    }

    return { success: true };

  } catch (e: any) {
    if (logId) await updateServerLog(logId, { status: 'failed', output: `Internal Error: ${e.message}` });
    await logErrorToDatabase({ message: `Failed to deploy redirects: ${e.message}`, stack: e.stack, source: 'deployRedirects' });
    return { success: false, error: e.message };
  }
}
