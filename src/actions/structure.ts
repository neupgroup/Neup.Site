
'use server';

import { getFirestore, doc, getDoc, setDoc, serverTimestamp, Timestamp, collection, getDocs, addDoc, query, orderBy, limit, where } from 'firebase/firestore';
import { cookies } from 'next/headers';
import { initializeFirebase } from '@/lib/firebase';
import type { Structure, PathStructure, Deployment, Site } from '@/schemas/site';
import { logErrorToFirestore } from '@/lib/logging';
import { getPages } from './editor/pages';
import { getSite } from './editor/site';
import { getPrivateServerDetails } from '@/actions/servers';
import { NodeSSH } from 'node-ssh';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { createServerLog, updateServerLog } from '@/actions/server-logs';
import { getRedirects, Redirect } from './redirects';


/**
 * Gets the deployment structure for the current site.
 */
export async function getStructure(): Promise<{ success: boolean; structure?: Structure; error?: string }> {
  const cookieStore = await cookies();
  const siteId = cookieStore.get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };

  try {
    const { firestore } = initializeFirebase();
    const structureRef = doc(firestore, 'structure', siteId);
    const docSnap = await getDoc(structureRef);

    if (!docSnap.exists()) {
      return { success: true, structure: undefined };
    }

    const data = docSnap.data();
    const structure: Structure = {
      id: docSnap.id,
      siteId: data.siteId,
      status: data.status,
      structure: data.structure || [],
      themeChanged: data.themeChanged || false,
      redirectsChanged: data.redirectsChanged || false,
      assetsChanged: data.assetsChanged || false,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : null,
    };
    return { success: true, structure };
  } catch (error: any) {
    await logErrorToFirestore({ message: `Failed to get structure: ${error.message}`, stack: error.stack, source: 'getStructure' });
    return { success: false, error: 'Failed to get structure.' };
  }
}

/**
 * Gets the last successful deployment record for the current site.
 */
export async function getLastDeployment(): Promise<{ success: boolean; deployment?: Deployment; error?: string }> {
  const cookieStore = await cookies();
  const siteId = cookieStore.get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };

  try {
    const { firestore } = initializeFirebase();
    const deploymentsRef = collection(firestore, 'deployments');
    const q = query(
      deploymentsRef,
      where('siteId', '==', siteId),
      where('status', '==', 'deployed'),
      orderBy('attemptedOn', 'desc'),
      limit(1)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: true, deployment: undefined };
    }

    const docSnap = querySnapshot.docs[0];
    const data = docSnap.data();
    const deployment: Deployment = {
      id: docSnap.id,
      siteId: data.siteId,
      structure: data.structure || [],
      status: data.status,
      theme: data.theme,
      redirects: data.redirects,
      siteProfile: data.siteProfile,
      attemptedOn: data.attemptedOn instanceof Timestamp ? data.attemptedOn.toDate().toISOString() : null,
    };
    return { success: true, deployment };

  } catch (error: any) {
    await logErrorToFirestore({ message: `Failed to get last deployment: ${error.message}`, stack: error.stack, source: 'getLastDeployment' });
    return { success: false, error: 'Failed to get last deployment.' };
  }
}

/**
 * Compiles pages and paths into a structure document, marking it as pending deployment.
 */
export async function buildStructure(): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies();
  const siteId = cookieStore.get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };

  try {
    const { firestore } = initializeFirebase();
    const { success, pages, error } = await getPages();

    if (!success) {
      return { success: false, error: error || 'Failed to fetch pages for build.' };
    }

    const structureDoc: PathStructure[] = [];
    if (pages) {
      for (const page of pages) {
        if (page.paths && page.paths.length > 0) {
          for (const path of page.paths) {
            structureDoc.push({
              path: path.path,
              pageId: page.id,
              sections: page.elements.map(el => el.id),
              theme: {}, // Placeholder for future theme overrides
              changesMade: true, // Always mark as changed on a fresh build
            });
          }
        }
      }
    }

    const structureRef = doc(firestore, 'structure', siteId);
    await setDoc(structureRef, {
      siteId,
      structure: structureDoc,
      status: 'pendingDeployment',
      updatedAt: serverTimestamp(),
    }, { merge: true });

    return { success: true };
  } catch (error: any) {
    await logErrorToFirestore({ message: `Failed to build structure: ${error.message}`, stack: error.stack, source: 'buildStructure' });
    return { success: false, error: 'Failed to build site structure.' };
  }
}


/**
 * Creates a new deployment record and marks the structure as deployed.
 */
export async function createDeployment(): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies();
  const siteId = cookieStore.get('siteId')?.value;
  if (!siteId) return { success: false, error: 'Site ID not found.' };

  try {
    const { firestore } = initializeFirebase();
    const structureRef = doc(firestore, 'structure', siteId);
    const structureSnap = await getDoc(structureRef);

    if (!structureSnap.exists()) {
      return { success: false, error: 'No structure found to deploy. Please build first.' };
    }

    const { site } = await getSite();
    const currentStructure = structureSnap.data() as Structure;

    const redirectsResult = await getRedirects();
    const redirects = redirectsResult.success ? redirectsResult.redirects : [];
    
    const formattedRedirects = redirects?.map(r => ({
      source: r.from,
      destination: r.to,
      permanent: r.type === 'permanent',
      id: r.id,
      createdAt: r.created_on,
    }));

    // Create a new document in the 'deployments' collection
    await addDoc(collection(firestore, 'deployments'), {
      siteId,
      structure: currentStructure.structure,
      status: 'deployed',
      theme: site?.theme || {},
      redirects: formattedRedirects,
      siteProfile: { name: site?.name, logoUrl: site?.logoUrl, hideSitename: site?.hideSitename },
      attemptedOn: serverTimestamp(),
    });

    // Upload structure, theme, and redirects to the server
    await uploadStructureToServer(siteId, currentStructure.structure, site?.theme || {}, formattedRedirects || []);

    // Reset the staging structure
    const updatedPaths = currentStructure.structure.map(p => ({ ...p, changesMade: false }));
    await setDoc(structureRef, {
      status: 'deployed',
      structure: updatedPaths,
      themeChanged: false,
      redirectsChanged: false,
      assetsChanged: false,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    return { success: true };
  } catch (error: any) {
    await logErrorToFirestore({ message: `Failed to create deployment: ${error.message}`, stack: error.stack, source: 'createDeployment' });
    return { success: false, error: 'Failed to create deployment record.' };
  }
}

async function uploadStructureToServer(siteId: string, structure: any, theme: any, redirects: any[]): Promise<{ success: boolean; error?: string }> {
  let logId: string | undefined;

  try {
    const { firestore } = initializeFirebase();
    const allocationsQuery = query(
      collection(firestore, 'allocations'),
      where('siteId', '==', siteId),
      limit(1)
    );
    let allocationsSnapshot = await getDocs(allocationsQuery);

    if (allocationsSnapshot.empty) {
      console.warn(`No server allocated for site ${siteId}. Structure not uploaded.`);
      return { success: true };
    }

    const allocation = allocationsSnapshot.docs[0].data();
    const serverId = allocation.serverId;

    const { server, error } = await getPrivateServerDetails(serverId);
    if (error || !server || !server.publicIp || !server.privateKey) {
      console.error(`Server details not found for ${serverId}: ${error}`);
      return { success: false, error: error || 'Server details not found' };
    }

    const logResult = await createServerLog({
      serverId: serverId,
      commandName: 'Deploy Site Data',
      command: 'Uploading site structure, theme, and redirects to server...',
      output: 'Starting deployment process...',
      status: 'pending',
      initiatedBy: 'system'
    });

    if (logResult.success && logResult.id) {
      logId = logResult.id;
    }
    
    const resolvedAppPath = server.appPath?.replace(/\{\{\s*universal\.site_id\s*\}\}/g, siteId) || `/var/www/${siteId}`;
    const targetDir = `${resolvedAppPath}/src`;

    const ssh = new NodeSSH();
    console.log(`Connecting to ${server.publicIp} to upload data...`);
    if (logId) await updateServerLog(logId, { status: 'ongoing', output: `Connecting to ${server.publicIp}...` });

    try {
      await ssh.connect({
        host: server.publicIp,
        username: server.username || 'root',
        privateKey: server.privateKey
      });

      const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'deployment-'));
      const tempStructurePath = path.join(tempDir, `structure.json`);
      const tempThemePath = path.join(tempDir, `theme.json`);
      const tempRedirectsPath = path.join(tempDir, `redirects.json`);

      await fs.promises.writeFile(tempStructurePath, JSON.stringify(structure, null, 2));
      await fs.promises.writeFile(tempThemePath, JSON.stringify(theme, null, 2));
      await fs.promises.writeFile(tempRedirectsPath, JSON.stringify(redirects, null, 2));

      try {
        if (logId) await updateServerLog(logId, { output: `Connected. Uploading files to ${targetDir}...` });
        await ssh.execCommand(`mkdir -p ${targetDir}`);
        await ssh.putDirectory(tempDir, targetDir, {
            recursive: true,
            concurrency: 1,
            tick: (localPath, remotePath, error) => {
              if (error) {
                console.error(`Failed to upload ${localPath}`);
              }
            }
        });

        const successMsg = 'Structure, theme, and redirects uploaded successfully.';
        console.log(successMsg);
        if (logId) await updateServerLog(logId, { status: 'completed', output: successMsg });

      } finally {
        await fs.promises.rm(tempDir, { recursive: true, force: true });
      }

    } catch (sshError: any) {
      console.error('SSH Error uploading site data:', sshError);
      const errMsg = `Failed to upload data to server: ${sshError.message}`;
      if (logId) await updateServerLog(logId, { status: 'failed', output: errMsg });
      throw new Error(errMsg);
    } finally {
      ssh.dispose();
    }

    return { success: true };

  } catch (e: any) {
    if (logId) await updateServerLog(logId, { status: 'failed', output: `Internal Error: ${e.message}` });
    await logErrorToFirestore({ message: `Failed to upload site data: ${e.message}`, stack: e.stack, source: 'uploadStructureToServer' });
    return { success: false, error: e.message };
  }
}


/**
 * Marks specific paths as changed and sets the structure status to pendingDeployment.
 */
export async function markStructureAsPending(siteId: string, paths: string[], isDeletion: boolean = false): Promise<void> {
  try {
    const { firestore } = initializeFirebase();
    const structureRef = doc(firestore, 'structure', siteId);
    const structureSnap = await getDoc(structureRef);

    let finalStructure: PathStructure[] = [];

    if (structureSnap.exists()) {
      const currentStructure = structureSnap.data() as Omit<Structure, 'id'>;
      finalStructure = currentStructure.structure.map(p => {
        if (paths.includes(p.path)) {
          return { ...p, changesMade: true };
        }
        return p;
      });
      if (isDeletion) {
        finalStructure = finalStructure.filter(p => !paths.includes(p.path));
      }
    } else if (!isDeletion) {
      const { pages } = await getPages();
      const pagesWithPaths = pages?.filter(p => p.paths && p.paths.some(pathInfo => paths.includes(pathInfo.path))) || [];

      for (const page of pagesWithPaths) {
        for (const pathInfo of page.paths!) {
          if (paths.includes(pathInfo.path)) {
            finalStructure.push({
              path: pathInfo.path,
              pageId: page.id,
              sections: page.elements.map(el => el.id),
              theme: {},
              changesMade: true,
            });
          }
        }
      }
    }

    await setDoc(structureRef, {
      siteId: siteId,
      status: 'pendingDeployment',
      structure: finalStructure,
      updatedAt: serverTimestamp()
    }, { merge: true });

  } catch (error: any) {
    await logErrorToFirestore({
      message: `Failed to mark structure as pending: ${error.message}`,
      stack: error.stack,
      source: 'markStructureAsPending'
    });
  }
}

export async function markAssetsAsPending(siteId: string): Promise<void> {
  try {
    const { firestore } = initializeFirebase();
    const structureRef = doc(firestore, 'structure', siteId);
    await setDoc(structureRef, { assetsChanged: true, status: 'pendingDeployment' }, { merge: true });
  } catch (e: any) {
    console.error("Failed to mark assets as pending:", e);
  }
}

export async function markThemeAsPending(siteId: string): Promise<void> {
  try {
    const { firestore } = initializeFirebase();
    const structureRef = doc(firestore, 'structure', siteId);
    await setDoc(structureRef, { themeChanged: true, status: 'pendingDeployment' }, { merge: true });
  } catch (e: any) {
    console.error("Failed to mark theme as pending:", e);
  }
}

export async function markRedirectsAsPending(siteId: string): Promise<void> {
  try {
    const { firestore } = initializeFirebase();
    const structureRef = doc(firestore, 'structure', siteId);
    await setDoc(structureRef, { redirectsChanged: true, status: 'pendingDeployment' }, { merge: true });
  } catch (e: any) {
    console.error("Failed to mark redirects as pending:", e);
  }
}
