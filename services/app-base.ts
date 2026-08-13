

'use server';

import { getPrivateServerDetails } from '@/services/servers';
import { getAsset } from '@/services/editor/asset';
import { getAccountId } from './accounts';
import { NodeSSH } from 'node-ssh';
import { logErrorToDatabase } from '@/logica.logger';
import { prisma as db } from '@/core/database/prisma';
import type { AppBaseBackup, AppBaseFile } from '@/services/app-base/type';
import { cookies } from 'next/headers';
import { markAppBaseAsPending } from './structure';

async function resolveAppBasePath(serverId: string, type: 'internal' | 'external') {
  const { server, error: serverError } = await getPrivateServerDetails(serverId);
  if (serverError || !server) throw new Error('Could not retrieve server details for path resolution.');

  const { asset, error: assetError } = await getAsset();
  if (assetError || !asset) throw new Error('Could not retrieve asset details for path resolution.');

  const appPath = server.appPath?.replace(/\{\{universal\.(?:site_id|asset_id)\}\}/g, asset.id) || `/var/www/${asset.id}`;
  const basePath = type === 'internal' ? `${appPath}/src/base` : `${appPath}/base`;

  return { ssh: new NodeSSH(), server, basePath };
}

export async function getAppBaseFiles(serverId: string): Promise<{ success: boolean; files?: AppBaseFile[]; error?: string }> {
  let ssh: NodeSSH | undefined;
  try {
    const fetchFilesFromPath = async (type: 'internal' | 'external'): Promise<AppBaseFile[]> => {
      const { ssh: sshInstance, server, basePath } = await resolveAppBasePath(serverId, type);
      ssh = sshInstance;
      await ssh.connect({ host: server.publicIp, username: server.username || 'root', privateKey: server.privateKey });
      await ssh.execCommand(`mkdir -p ${basePath}`);
      const result = await ssh.execCommand(`ls -la ${basePath}`);
      ssh.dispose();

      if (result.code !== 0) { console.warn(`Could not list files in ${basePath}: ${result.stderr}`); return []; }

      return result.stdout.trim().split('\n').slice(1).map(line => {
        const parts = line.split(/\s+/);
        if (parts.length < 9 || parts[0].startsWith('d')) return null;
        const fileName = parts[8];
        if (!fileName.endsWith('.json')) return null;
        return { name: fileName.replace('.json', ''), size: parts[4], type, status: 'created' };
      }).filter((file): file is AppBaseFile => file !== null);
    };

    const [internalFiles, externalFiles] = await Promise.all([fetchFilesFromPath('internal'), fetchFilesFromPath('external')]);
    return { success: true, files: [...internalFiles, ...externalFiles].sort((a, b) => a.name.localeCompare(b.name)) };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to get app base files: ${e.message}`, source: 'getAppBaseFiles' });
    return { success: false, error: e.message };
  }
}

export async function createAppBaseFile(serverId: string, name: string, type: 'internal' | 'external'): Promise<{ success: boolean; error?: string }> {
  const sanitizedName = name.replace(/[^a-zA-Z0-9-]/g, '_');
  const fileName = `${sanitizedName}.json`;
  const cookieStore = await cookies();
  const assetId = cookieStore.get('assetId')?.value;

  let ssh: NodeSSH | undefined;
  try {
    const { ssh: sshInstance, server, basePath } = await resolveAppBasePath(serverId, type);
    ssh = sshInstance;
    await ssh.connect({ host: server.publicIp, username: server.username || 'root', privateKey: server.privateKey });

    const filePath = `${basePath}/${fileName}`;
    const templatePath = `${basePath}/${sanitizedName}.template.json`;
    const checkTemplateResult = await ssh.execCommand(`test -f ${templatePath}`);

    let content = '{}';
    if (checkTemplateResult.code === 0) {
      const catResult = await ssh.execCommand(`cat ${templatePath}`);
      if (catResult.code === 0) content = catResult.stdout;
    }

    await ssh.exec('tee', [filePath], { stdin: content });
    if (assetId) await markAppBaseAsPending(assetId);
    return { success: true };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to create app base file: ${e.message}`, source: 'createAppBaseFile' });
    return { success: false, error: e.message };
  } finally {
    ssh?.dispose();
  }
}

export async function getAppBaseFileContent(serverId: string, fileName: string, type: 'internal' | 'external'): Promise<{ success: boolean; content?: string; error?: string }> {
  let ssh: NodeSSH | undefined;
  try {
    const { ssh: sshInstance, server, basePath } = await resolveAppBasePath(serverId, type);
    ssh = sshInstance;
    await ssh.connect({ host: server.publicIp, username: server.username || 'root', privateKey: server.privateKey });
    const result = await ssh.execCommand(`cat '${basePath}/${fileName}.json'`);
    if (result.code !== 0) throw new Error(result.stderr);
    return { success: true, content: result.stdout };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to get app base file content: ${e.message}`, source: 'getAppBaseFileContent' });
    return { success: false, error: e.message };
  } finally {
    ssh?.dispose();
  }
}

export async function saveAppBaseFileContent(serverId: string, fileName: string, content: string, type: 'internal' | 'external'): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies();
  const assetId = cookieStore.get('assetId')?.value;
  let ssh: NodeSSH | undefined;
  try {
    const { ssh: sshInstance, server, basePath } = await resolveAppBasePath(serverId, type);
    ssh = sshInstance;
    await ssh.connect({ host: server.publicIp, username: server.username || 'root', privateKey: server.privateKey });
    await ssh.exec('tee', [`${basePath}/${fileName}.json`], { stdin: content });
    if (assetId) await markAppBaseAsPending(assetId);
    return { success: true };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to save app base file content: ${e.message}`, source: 'saveAppBaseFileContent' });
    return { success: false, error: e.message };
  } finally {
    ssh?.dispose();
  }
}

export async function backupAppBaseFile(serverId: string, fileName: string, type: 'internal' | 'external'): Promise<{ success: boolean; error?: string }> {
  try {
    const contentResult = await getAppBaseFileContent(serverId, fileName, type);
    if (!contentResult.success || !contentResult.content) throw new Error(contentResult.error || 'Could not read file content for backup.');

    const accountId = await getAccountId();
    const { asset } = await getAsset();
    if (!asset) throw new Error('Asset context not found.');

    await db.appBaseBackup.create({
      data: { assetId: asset.id, fileName: `${fileName}.json`, fileType: type, content: contentResult.content, backedUpAt: new Date(), backedUpBy: accountId },
    });
    return { success: true };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to backup file ${fileName}: ${e.message}`, source: 'backupAppBaseFile' });
    return { success: false, error: e.message };
  }
}

export async function getAppBaseBackups(): Promise<{ success: boolean; backups?: AppBaseBackup[]; error?: string }> {
  try {
    const { asset } = await getAsset();
    if (!asset) throw new Error('Asset context not found.');

    const records = await db.appBaseBackup.findMany({
      where: { assetId: asset.id },
      orderBy: { backedUpAt: 'desc' },
    });

    const backups: AppBaseBackup[] = records.map(r => ({
      id: r.id,
      assetId: r.assetId,
      fileName: r.fileName,
      fileType: r.fileType,
      content: r.content,
      backedUpAt: r.backedUpAt ? r.backedUpAt.toISOString() : null,
      backedUpBy: r.backedUpBy,
    }));
    return { success: true, backups };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to get backups: ${e.message}`, source: 'getAppBaseBackups' });
    return { success: false, error: e.message };
  }
}

export async function restoreAppBaseBackup(backupId: string, serverId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const record = await db.appBaseBackup.findUnique({ where: { id: backupId } });
    if (!record) throw new Error('Backup not found.');

    const fileType = record.fileType as 'internal' | 'external' || 'external';
    const baseFileName = record.fileName.replace('.json', '');
    const saveResult = await saveAppBaseFileContent(serverId, baseFileName, record.content, fileType);
    if (!saveResult.success) throw new Error(saveResult.error || 'Failed to write restored content to server.');
    return { success: true };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to restore backup ${backupId}: ${e.message}`, source: 'restoreAppBaseBackup' });
    return { success: false, error: e.message };
  }
}
