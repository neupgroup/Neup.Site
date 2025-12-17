
'use server';

import { getPrivateServerDetails } from '@/actions/servers';
import { getSite } from '@/actions/editor/site';
import { getAccountId } from './accounts';
import { NodeSSH } from 'node-ssh';
import { logErrorToFirestore } from '@/lib/logging';
import { initializeFirebase } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import type { AppBaseBackup } from '@/schemas/app-base';

async function getAppBasePath(serverId: string) {
    const { server, error: serverError } = await getPrivateServerDetails(serverId);
    if (serverError || !server) {
        throw new Error('Could not retrieve server details for path resolution.');
    }

    const { site, error: siteError } = await getSite();
    if (siteError || !site) {
        throw new Error('Could not retrieve site details for path resolution.');
    }

    const appPath = server.appPath?.replace(/\{\{universal.site_id\}\}/g, site.id) || `/var/www/${site.id}`;
    const basePath = `${appPath}/src/base`;

    return { ssh: new NodeSSH(), server, basePath };
}

export async function getAppBaseFiles(serverId: string): Promise<{ success: boolean; files?: { name: string; size: string }[]; error?: string }> {
    let ssh: NodeSSH | undefined;
    try {
        const { ssh: sshInstance, server, basePath } = await getAppBasePath(serverId);
        ssh = sshInstance;

        await ssh.connect({
            host: server.publicIp,
            username: server.username || 'root',
            privateKey: server.privateKey,
        });

        await ssh.execCommand(`mkdir -p ${basePath}`);
        const result = await ssh.execCommand(`ls -la ${basePath}`);
        
        if (result.code !== 0) {
            throw new Error(result.stderr);
        }

        const files = result.stdout.trim().split('\n').slice(1).map(line => {
            const parts = line.split(/\s+/);
            if (parts.length < 9 || parts[0].startsWith('d')) return null; // Skip directories
            return { name: parts[8], size: parts[4] };
        }).filter(Boolean) as { name: string, size: string }[];

        return { success: true, files };
    } catch (e: any) {
        await logErrorToFirestore({ message: `Failed to get app base files: ${e.message}`, source: 'getAppBaseFiles' });
        return { success: false, error: e.message };
    } finally {
        ssh?.dispose();
    }
}

export async function createAppBaseFile(serverId: string, fileName: string): Promise<{ success: boolean; error?: string }> {
     if (!fileName.endsWith('.json')) {
        return { success: false, error: 'File must have a .json extension.'};
    }
    let ssh: NodeSSH | undefined;
    try {
        const { ssh: sshInstance, server, basePath } = await getAppBasePath(serverId);
        ssh = sshInstance;

        await ssh.connect({
            host: server.publicIp,
            username: server.username || 'root',
            privateKey: server.privateKey,
        });

        const filePath = `${basePath}/${fileName}`;
        await ssh.execCommand(`echo "{}" > ${filePath}`);
        
        return { success: true };
    } catch (e: any) {
        await logErrorToFirestore({ message: `Failed to create app base file: ${e.message}`, source: 'createAppBaseFile' });
        return { success: false, error: e.message };
    } finally {
        ssh?.dispose();
    }
}

export async function getAppBaseFileContent(serverId: string, fileName: string): Promise<{ success: boolean; content?: string; error?: string }> {
     let ssh: NodeSSH | undefined;
    try {
        const { ssh: sshInstance, server, basePath } = await getAppBasePath(serverId);
        ssh = sshInstance;

        await ssh.connect({
            host: server.publicIp,
            username: server.username || 'root',
            privateKey: server.privateKey,
        });
        
        const filePath = `${basePath}/${fileName}`;
        const result = await ssh.execCommand(`cat ${filePath}`);
        
        if (result.code !== 0) {
            throw new Error(result.stderr);
        }

        return { success: true, content: result.stdout };
    } catch (e: any) {
        await logErrorToFirestore({ message: `Failed to get app base file content: ${e.message}`, source: 'getAppBaseFileContent' });
        return { success: false, error: e.message };
    } finally {
        ssh?.dispose();
    }
}

export async function saveAppBaseFileContent(serverId: string, fileName: string, content: string): Promise<{ success: boolean; error?: string }> {
    let ssh: NodeSSH | undefined;
    try {
        const { ssh: sshInstance, server, basePath } = await getAppBasePath(serverId);
        ssh = sshInstance;

        await ssh.connect({
            host: server.publicIp,
            username: server.username || 'root',
            privateKey: server.privateKey,
        });

        const filePath = `${basePath}/${fileName}`;
        await ssh.exec('tee', [filePath], { stdin: content });
        
        return { success: true };
    } catch (e: any) {
        await logErrorToFirestore({ message: `Failed to save app base file content: ${e.message}`, source: 'saveAppBaseFileContent' });
        return { success: false, error: e.message };
    } finally {
        ssh?.dispose();
    }
}


export async function backupAppBaseFile(serverId: string, fileName: string): Promise<{ success: boolean; error?: string }> {
    try {
        const contentResult = await getAppBaseFileContent(serverId, fileName);
        if (!contentResult.success || !contentResult.content) {
            throw new Error(contentResult.error || "Could not read file content for backup.");
        }

        const accountId = await getAccountId();
        const { site } = await getSite();
        if (!site) {
            throw new Error("Site context not found.");
        }

        const { firestore } = initializeFirebase();
        await addDoc(collection(firestore, 'appBaseBackups'), {
            siteId: site.id,
            fileName,
            content: contentResult.content,
            backedUpAt: serverTimestamp(),
            backedUpBy: accountId,
        });
        
        return { success: true };
    } catch (e: any) {
        await logErrorToFirestore({ message: `Failed to backup file ${fileName}: ${e.message}`, source: 'backupAppBaseFile' });
        return { success: false, error: e.message };
    }
}


export async function getAppBaseBackups(): Promise<{ success: boolean; backups?: AppBaseBackup[]; error?: string }> {
    try {
        const { site } = await getSite();
        if (!site) {
            throw new Error("Site context not found.");
        }

        const { firestore } = initializeFirebase();
        const q = query(
            collection(firestore, 'appBaseBackups'), 
            where('siteId', '==', site.id), 
            orderBy('backedUpAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const backups = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AppBaseBackup[];

        return { success: true, backups };
    } catch (e: any) {
        await logErrorToFirestore({ message: `Failed to get backups: ${e.message}`, source: 'getAppBaseBackups' });
        return { success: false, error: e.message };
    }
}

export async function restoreAppBaseBackup(backupId: string, serverId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { firestore } = initializeFirebase();
        const backupRef = doc(firestore, 'appBaseBackups', backupId);
        const backupSnap = await getDoc(backupRef);

        if (!backupSnap.exists()) {
            throw new Error("Backup not found.");
        }

        const backupData = backupSnap.data() as AppBaseBackup;
        
        const saveResult = await saveAppBaseFileContent(serverId, backupData.fileName, backupData.content);
        
        if (!saveResult.success) {
            throw new Error(saveResult.error || "Failed to write restored content to server.");
        }

        return { success: true };
    } catch (e: any) {
        await logErrorToFirestore({ message: `Failed to restore backup ${backupId}: ${e.message}`, source: 'restoreAppBaseBackup' });
        return { success: false, error: e.message };
    }
}
