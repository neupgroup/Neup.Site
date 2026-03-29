

'use server';

import { getPrivateServerDetails } from '@/actions/servers';
import { getSite } from '@/actions/editor/site';
import { getAccountId } from './accounts';
import { NodeSSH } from 'node-ssh';
import { logErrorToDatabase } from '@/lib/logging';
import { getDataStore } from '@/lib/data-store';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, limit, doc, getDoc } from '@/lib/firestore';
import type { AppBaseBackup, AppBaseFile } from '@/schemas/app-base';
import { cookies } from 'next/headers';
import { markAppBaseAsPending } from './structure';

async function resolveAppBasePath(serverId: string, type: 'internal' | 'external') {
    const { server, error: serverError } = await getPrivateServerDetails(serverId);
    if (serverError || !server) {
        throw new Error('Could not retrieve server details for path resolution.');
    }

    const { site, error: siteError } = await getSite();
    if (siteError || !site) {
        throw new Error('Could not retrieve site details for path resolution.');
    }

    const appPath = server.appPath?.replace(/\{\{universal.site_id\}\}/g, site.id) || `/var/www/${site.id}`;

    // Corrected logic: Internal is /src/base, External is /base
    const basePath = type === 'internal' ? `${appPath}/src/base` : `${appPath}/base`;

    return { ssh: new NodeSSH(), server, basePath };
}

export async function getAppBaseFiles(serverId: string): Promise<{ success: boolean; files?: AppBaseFile[]; error?: string }> {
    let ssh: NodeSSH | undefined;
    try {
        const fetchFilesFromPath = async (type: 'internal' | 'external'): Promise<AppBaseFile[]> => {
            const { ssh: sshInstance, server, basePath } = await resolveAppBasePath(serverId, type);
            ssh = sshInstance;

            await ssh.connect({
                host: server.publicIp,
                username: server.username || 'root',
                privateKey: server.privateKey,
            });

            await ssh.execCommand(`mkdir -p ${basePath}`);
            const result = await ssh.execCommand(`ls -la ${basePath}`);
            ssh.dispose();

            if (result.code !== 0) {
                console.warn(`Could not list files in ${basePath}: ${result.stderr}`);
                return [];
            }

            return result.stdout.trim().split('\n').slice(1).map(line => {
                const parts = line.split(/\s+/);
                if (parts.length < 9 || parts[0].startsWith('d')) return null;

                const fileName = parts[8];
                if (!fileName.endsWith('.json')) return null;

                return {
                    name: fileName.replace('.json', ''),
                    size: parts[4],
                    type: type,
                    status: 'created' // Simplified status
                };
            }).filter((file): file is AppBaseFile => file !== null);
        };

        const [internalFiles, externalFiles] = await Promise.all([
            fetchFilesFromPath('internal'),
            fetchFilesFromPath('external')
        ]);

        const allFiles = [...internalFiles, ...externalFiles];
        const sortedFiles = allFiles.sort((a, b) => a.name.localeCompare(b.name));

        return { success: true, files: sortedFiles };

    } catch (e: any) {
        await logErrorToDatabase({ message: `Failed to get app base files: ${e.message}`, source: 'getAppBaseFiles' });
        return { success: false, error: e.message };
    }
}


export async function createAppBaseFile(serverId: string, name: string, type: 'internal' | 'external'): Promise<{ success: boolean; error?: string }> {
    const sanitizedName = name.replace(/[^a-zA-Z0-9-]/g, '_');
    const fileName = `${sanitizedName}.json`;
    const siteId = cookies().get('siteId')?.value;

    let ssh: NodeSSH | undefined;
    try {
        const { ssh: sshInstance, server, basePath } = await resolveAppBasePath(serverId, type);
        ssh = sshInstance;

        await ssh.connect({
            host: server.publicIp,
            username: server.username || 'root',
            privateKey: server.privateKey,
        });

        const filePath = `${basePath}/${fileName}`;

        // Check if template exists, if so, copy its content
        const templatePath = `${basePath}/${sanitizedName}.template.json`;
        const checkTemplateResult = await ssh.execCommand(`test -f ${templatePath}`);

        let content = '{}';
        if (checkTemplateResult.code === 0) {
            const catResult = await ssh.execCommand(`cat ${templatePath}`);
            if (catResult.code === 0) {
                content = catResult.stdout;
            }
        }

        await ssh.exec('tee', [filePath], { stdin: content });
        
        if (siteId) {
            await markAppBaseAsPending(siteId);
        }

        return { success: true };
    } catch (e: any) {
        await logErrorToDatabase({ message: `Failed to create app base file: ${e.message}`, source: 'createAppBaseFile' });
        return { success: false, error: e.message };
    } finally {
        ssh?.dispose();
    }
}

export async function getAppBaseFileContent(serverId: string, fileName: string, type: 'internal' | 'external'): Promise<{ success: boolean; content?: string; error?: string }> {
    const fullFileName = `${fileName}.json`;
    let ssh: NodeSSH | undefined;
    try {
        const { ssh: sshInstance, server, basePath } = await resolveAppBasePath(serverId, type);
        ssh = sshInstance;

        await ssh.connect({
            host: server.publicIp,
            username: server.username || 'root',
            privateKey: server.privateKey,
        });

        const filePath = `${basePath}/${fullFileName}`;
        const result = await ssh.execCommand(`cat '${filePath}'`);

        if (result.code !== 0) {
            throw new Error(result.stderr);
        }

        return { success: true, content: result.stdout };
    } catch (e: any) {
        await logErrorToDatabase({ message: `Failed to get app base file content: ${e.message}`, source: 'getAppBaseFileContent' });
        return { success: false, error: e.message };
    } finally {
        ssh?.dispose();
    }
}

export async function saveAppBaseFileContent(serverId: string, fileName: string, content: string, type: 'internal' | 'external'): Promise<{ success: boolean; error?: string }> {
    const fullFileName = `${fileName}.json`;
    const siteId = cookies().get('siteId')?.value;
    let ssh: NodeSSH | undefined;
    try {
        const { ssh: sshInstance, server, basePath } = await resolveAppBasePath(serverId, type);
        ssh = sshInstance;

        await ssh.connect({
            host: server.publicIp,
            username: server.username || 'root',
            privateKey: server.privateKey,
        });

        const filePath = `${basePath}/${fullFileName}`;
        await ssh.exec('tee', [filePath], { stdin: content });
        
        if (siteId) {
            await markAppBaseAsPending(siteId);
        }

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
        if (!contentResult.success || !contentResult.content) {
            throw new Error(contentResult.error || "Could not read file content for backup.");
        }

        const accountId = await getAccountId();
        const { site } = await getSite();
        if (!site) {
            throw new Error("Site context not found.");
        }

        const { firestore } = getDataStore();
        await addDoc(collection(firestore, 'appBaseBackups'), {
            siteId: site.id,
            fileName: `${fileName}.json`, // Store full filename
            fileType: type,
            content: contentResult.content,
            backedUpAt: serverTimestamp(),
            backedUpBy: accountId,
        });

        return { success: true };
    } catch (e: any) {
        await logErrorToDatabase({ message: `Failed to backup file ${fileName}: ${e.message}`, source: 'backupAppBaseFile' });
        return { success: false, error: e.message };
    }
}


export async function getAppBaseBackups(): Promise<{ success: boolean; backups?: AppBaseBackup[]; error?: string }> {
    try {
        const { site } = await getSite();
        if (!site) {
            throw new Error("Site context not found.");
        }

        const { firestore } = getDataStore();
        const q = query(
            collection(firestore, 'appBaseBackups'),
            where('siteId', '==', site.id),
            orderBy('backedUpAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const backups = querySnapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                siteId: data.siteId,
                fileName: data.fileName,
                fileType: data.fileType,
                content: data.content,
                backedUpAt: data.backedUpAt?.toDate?.()?.toISOString() || null,
                backedUpBy: data.backedUpBy,
            } as AppBaseBackup;
        });

        return { success: true, backups };
    } catch (e: any) {
        await logErrorToDatabase({ message: `Failed to get backups: ${e.message}`, source: 'getAppBaseBackups' });
        return { success: false, error: e.message };
    }
}

export async function restoreAppBaseBackup(backupId: string, serverId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { firestore } = getDataStore();
        const backupRef = doc(firestore, 'appBaseBackups', backupId);
        const backupSnap = await getDoc(backupRef);

        if (!backupSnap.exists()) {
            throw new Error("Backup not found.");
        }

        const backupData = backupSnap.data() as AppBaseBackup;
        const fileType = backupData.fileType || 'external'; // Default to external for backward compatibility
        const baseFileName = backupData.fileName.replace('.json', '');

        const saveResult = await saveAppBaseFileContent(serverId, baseFileName, backupData.content, fileType);

        if (!saveResult.success) {
            throw new Error(saveResult.error || "Failed to write restored content to server.");
        }

        return { success: true };
    } catch (e: any) {
        await logErrorToDatabase({ message: `Failed to restore backup ${backupId}: ${e.message}`, source: 'restoreAppBaseBackup' });
        return { success: false, error: e.message };
    }
}
