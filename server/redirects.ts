'use server';

import { collection, doc, setDoc, getDocs, Timestamp, deleteDoc, serverTimestamp, addDoc, query, where, orderBy, limit, getCountFromServer, startAfter } from '@/lib/firestore';
import { getDataStore } from '@/lib/data-store';
import { revalidatePath } from 'next/cache';
import type { Redirect } from '@/schemas/redirect';
import { logErrorToDatabase } from '@/lib/logging';
import { getAccountId } from '@/server/accounts';
import { cookies } from 'next/headers';
import { markRedirectsAsPending } from './structure';
import { getPrivateServerDetails } from '@/server/servers';
import { createServerLog, updateServerLog } from '@/server/server-logs';
import { NodeSSH } from 'node-ssh';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

export async function createRedirect(data: Omit<Redirect, 'id' | 'artifactId' | 'created_by' | 'created_on'>): Promise<{ success: boolean; id?: string; error?: string }> {
  const accountId = await getAccountId();
  const artifactId = (await cookies()).get('artifactId')?.value;

  if (!accountId || !artifactId) {
    return { success: false, error: 'User or site context not found.' };
  }

  try {
    const { firestore } = getDataStore();
    const docRef = await addDoc(collection(firestore, 'redirects'), {
      ...data,
      artifactId,
      created_by: accountId,
      created_on: serverTimestamp(),
    });

    await markRedirectsAsPending(artifactId);

    revalidatePath('/manage/redirects');
    return { success: true, id: docRef.id };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to create redirect: ${e.message}`, stack: e.stack, source: 'createRedirect' });
    return { success: false, error: 'Failed to create redirect.' };
  }
}

export async function getRedirects({ page = 1, pageSize = 10 }: { page?: number; pageSize?: number }): Promise<{ success: boolean; redirects?: Redirect[]; error?: string; totalCount?: number }> {
  const artifactId = (await cookies()).get('artifactId')?.value;
  if (!artifactId) {
    return { success: false, error: 'Artifact context not found.' };
  }

  try {
    const { firestore } = getDataStore();
    const redirectsRef = collection(firestore, 'redirects');
    const siteQuery = query(redirectsRef, where('artifactId', '==', artifactId));

    const countSnapshot = await getCountFromServer(siteQuery);
    const totalCount = countSnapshot.data().count;

    const baseQuery = query(siteQuery, orderBy('created_on', 'desc'));

    let finalQuery;
    if (page > 1) {
      const prevPageQuery = query(baseQuery, limit((page - 1) * pageSize));
      const prevPageSnapshot = await getDocs(prevPageQuery);
      const lastVisible = prevPageSnapshot.docs[prevPageSnapshot.docs.length - 1];
      finalQuery = query(baseQuery, startAfter(lastVisible), limit(pageSize));
    } else {
      finalQuery = query(baseQuery, limit(pageSize));
    }

    const querySnapshot = await getDocs(finalQuery);
    const redirects = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      const createdOn = data.created_on;
      return {
        id: docSnap.id,
        artifactId: data.artifactId,
        from: data.from,
        to: data.to,
        type: data.type,
        created_by: data.created_by,
        created_on: createdOn instanceof Timestamp ? createdOn.toDate().toISOString() : null,
      } as Redirect;
    });
    return { success: true, redirects, totalCount };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to get redirects: ${e.message}`, stack: e.stack, source: 'getRedirects' });
    return { success: false, error: 'Failed to fetch redirects.' };
  }
}

export async function deleteRedirect(id: string): Promise<{ success: boolean; error?: string }> {
  const artifactId = (await cookies()).get('artifactId')?.value;
  if (!artifactId) {
    return { success: false, error: 'Artifact context not found.' };
  }

  try {
    const { firestore } = getDataStore();
    await deleteDoc(doc(firestore, 'redirects', id));

    await markRedirectsAsPending(artifactId);

    revalidatePath('/manage/redirects');
    return { success: true };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to delete redirect ${id}: ${e.message}`, stack: e.stack, source: 'deleteRedirect' });
    return { success: false, error: 'Failed to delete redirect.' };
  }
}

export async function getAllRedirects(): Promise<{ success: boolean; redirects?: Redirect[]; error?: string }> {
  const artifactId = (await cookies()).get('artifactId')?.value;
  if (!artifactId) {
    return { success: false, error: 'Artifact context not found.' };
  }

  try {
    const { firestore } = getDataStore();
    const redirectsRef = collection(firestore, 'redirects');
    const q = query(redirectsRef, where('artifactId', '==', artifactId), orderBy('created_on', 'desc'));

    const querySnapshot = await getDocs(q);
    const redirects = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      const createdOn = data.created_on;
      return {
        id: docSnap.id,
        artifactId: data.artifactId,
        from: data.from,
        to: data.to,
        type: data.type,
        created_by: data.created_by,
        created_on: createdOn instanceof Timestamp ? createdOn.toDate().toISOString() : null,
      } as Redirect;
    });
    return { success: true, redirects };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to get all redirects: ${e.message}`, stack: e.stack, source: 'getAllRedirects' });
    return { success: false, error: 'Failed to fetch redirects.' };
  }
}

export async function deployRedirects(): Promise<{ success: boolean; error?: string }> {
  const artifactId = (await cookies()).get('artifactId')?.value;
  if (!artifactId) {
    return { success: false, error: 'Artifact context not found.' };
  }

  let logId: string | undefined;

  try {
    const { firestore } = getDataStore();
    const allocationsQuery = query(
      collection(firestore, 'allocations'),
      where('artifactId', '==', artifactId),
      limit(1)
    );
    const allocationsSnapshot = await getDocs(allocationsQuery);

    if (allocationsSnapshot.empty) {
      return { success: false, error: 'No server allocated for this site.' };
    }

    const allocation = allocationsSnapshot.docs[0].data();
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
    const resolvedAppPath = `/home/${username}/${artifactId}`;
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
