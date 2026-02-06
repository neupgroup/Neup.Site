

'use server';

import { getFirestore, doc, getDoc, setDoc, serverTimestamp, Timestamp, collection, getDocs, addDoc, query, orderBy, limit, where } from 'firebase/firestore';
import { cookies } from 'next/headers';
import { initializeFirebase } from '@/lib/firebase';
import type { Structure, PathStructure, Deployment, Site } from '@/schemas/site';
import type { EnvironmentVariable } from '@/schemas/environment';
import { logErrorToFirestore } from '@/lib/logging';
import { getPages } from './editor/pages';
import { getSite } from './editor/site';
import { getPrivateServerDetails } from '@/actions/servers';
import { NodeSSH } from 'node-ssh';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { createServerLog, updateServerLog } from '@/actions/server-logs';
import { getRedirects, getAllRedirects, Redirect } from './redirects';
import { getEnvironmentVariables } from './environment';


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
      appBaseChanged: data.appBaseChanged || false,
      environmentsChanged: data.environmentsChanged || false,
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
      environments: data.environments,
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

    const redirectsResult = await getAllRedirects();
    const redirects = redirectsResult.success ? redirectsResult.redirects : [];
    
    const envVarsResult = await getEnvironmentVariables({});
    const environments = envVarsResult.success ? envVarsResult.variables : [];

    // Create a new document in the 'deployments' collection
    await addDoc(collection(firestore, 'deployments'), {
      siteId,
      structure: currentStructure.structure || [],
      status: 'deployed',
      theme: site?.theme || {},
      redirects: redirects || [],
      siteProfile: { 
        name: site?.name || '', 
        logoUrl: site?.logoUrl || null,
        hideSitename: site?.hideSitename || false 
      },
      environments: environments || [],
      attemptedOn: serverTimestamp(),
    });

    // Upload structure, theme, and redirects to the server
    const uploadResult = await uploadStructureToServer(siteId, currentStructure, site || null, environments || []);

    // Even if upload fails, we still mark as deployed in the database
    // The upload can be retried later
    if (!uploadResult.success) {
      console.warn('Upload to server failed, but deployment record created:', uploadResult.error);
    }

    // Reset the staging structure
    const updatedPaths = (currentStructure.structure || []).map(p => ({ ...p, changesMade: false }));
    await setDoc(structureRef, {
      status: 'deployed',
      structure: updatedPaths,
      themeChanged: false,
      redirectsChanged: false,
      assetsChanged: false,
      appBaseChanged: false,
      environmentsChanged: false,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    return { success: true };
  } catch (error: any) {
    await logErrorToFirestore({ message: `Failed to create deployment: ${error.message}`, stack: error.stack, source: 'createDeployment' });
    return { success: false, error: error.message || 'Failed to create deployment record.' };
  }
}

async function uploadStructureToServer(siteId: string, structure: Structure, site: Site | null, environments: EnvironmentVariable[]): Promise<{ success: boolean; error?: string }> {
  let logId: string | undefined;

  try {
    const { firestore } = initializeFirebase();
    const allocationsQuery = query(
      collection(firestore, 'allocations'),
      where('siteId', '==', siteId),
      limit(1)
    );
    const allocationsSnapshot = await getDocs(allocationsQuery);

    if (allocationsSnapshot.empty) {
      console.warn(`No server allocated for site ${siteId}. Data not uploaded.`);
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
      command: 'Uploading site structure, theme, redirects, and profile to server...',
      output: 'Starting deployment process...',
      status: 'pending',
      initiatedBy: 'system'
    });

    if (logResult.success && logResult.id) {
      logId = logResult.id;
    }

    const username = server.username || 'root';
    const resolvedAppPath = `/home/${username}/${siteId}`;
    const srcDir = `${resolvedAppPath}/src`;
    const dataDir = `${srcDir}/data`;
    const baseDir = `${resolvedAppPath}/base`;
    const coreDir = `${baseDir}/core`;
    const siteDir = `${baseDir}/site`;

    const ssh = new NodeSSH();
    let outputLog = `Connecting to ${server.publicIp} to upload data...\n`;
    if (logId) await updateServerLog(logId, { status: 'ongoing', output: outputLog });

    try {
      await ssh.connect({
        host: server.publicIp,
        username: server.username || 'root',
        privateKey: server.privateKey
      });

      outputLog += `Connected. Preparing server directories...\n`;
      if (logId) await updateServerLog(logId, { output: outputLog });

      await ssh.execCommand(`mkdir -p ${srcDir} ${baseDir} ${coreDir} ${siteDir}`);
      // Clean up old data directory if it exists
      await ssh.execCommand(`rm -rf ${dataDir}`);
      outputLog += 'Directories ensured and old data cleaned.\n';
      if (logId) await updateServerLog(logId, { output: outputLog });


      // ---- Environment File Handling ----
      outputLog += '\n--- Handling .env file ---\n';
      const envPath = `${resolvedAppPath}/.env`;
      
      const deleteCmd = `rm -f ${envPath}`;
      outputLog += `> ${deleteCmd}\n`;
      if (logId) await updateServerLog(logId, { output: outputLog });
      const deleteResult = await ssh.execCommand(deleteCmd);
      if (deleteResult.code !== 0 && deleteResult.stderr) {
        outputLog += `Warning: ${deleteResult.stderr}\n`;
      } else {
        outputLog += 'Old .env file deleted (if it existed).\n';
      }
      if (logId) await updateServerLog(logId, { output: outputLog });

      if (environments.length > 0) {
        const envContent = environments.map(env => {
            if (env.dataType === 'string' && /\s/.test(env.value)) {
                return `${env.name}="${env.value.replace(/"/g, '\\"')}"`;
            }
            return `${env.name}=${env.value}`;
        }).join('\n');

        // Escape for heredoc
        const escapedEnvContent = envContent.replace(/\\/g, '\\\\').replace(/'/g, "'\\''").replace(/`/g, '\\`');

        const createCmd = `sudo bash -c "cat > ${envPath}" <<'EOF'\n${escapedEnvContent}\nEOF`;
        outputLog += `> Writing ${environments.length} variables to ${envPath} using cat heredoc.\n`;
        if (logId) await updateServerLog(logId, { output: outputLog });
        
        const createResult = await ssh.execCommand(createCmd);
        
        if (createResult.code !== 0) {
            outputLog += `Error creating .env file: ${createResult.stderr}\n`;
            if (logId) await updateServerLog(logId, { output: outputLog, status: 'failed' });
            throw new Error(`Failed to create .env file: ${createResult.stderr}`);
        } else {
            outputLog += 'New .env file created successfully.\n';
        }
      } else {
        outputLog += 'No environment variables to create.\n';
      }
      if (logId) await updateServerLog(logId, { output: outputLog });


      // ---- Other File Handling ----
      const tempBaseDir = await fs.mkdtemp(path.join(os.tmpdir(), 'deployment-'));
      
      try {
        outputLog += '\n--- Preparing local files for upload ---\n';
        if (logId) await updateServerLog(logId, { output: outputLog });

        const redirectsResult = await getAllRedirects();
        const redirects = redirectsResult.success ? redirectsResult.redirects : [];
        const siteProfile = { name: site?.name || '', logoUrl: site?.logoUrl || null, hideSitename: site?.hideSitename || false };

        const localCoreDir = path.join(tempBaseDir, 'core');
        const localSiteDir = path.join(tempBaseDir, 'site');
        await fs.mkdir(localCoreDir, { recursive: true });
        await fs.mkdir(localSiteDir, { recursive: true });

        await fs.writeFile(path.join(tempBaseDir, 'structure.json'), JSON.stringify(structure.structure || [], null, 2));
        await fs.writeFile(path.join(localSiteDir, 'theme.json'), JSON.stringify(site?.theme || {}, null, 2));
        await fs.writeFile(path.join(localCoreDir, 'redirects.json'), JSON.stringify(redirects || [], null, 2));
        await fs.writeFile(path.join(localSiteDir, 'profile.json'), JSON.stringify(siteProfile, null, 2));
        
        outputLog += `> Uploading structure.json to ${srcDir}/structure.json...\n`;
        if (logId) await updateServerLog(logId, { output: outputLog });
        await ssh.putFile(path.join(tempBaseDir, 'structure.json'), `${srcDir}/structure.json`);
        outputLog += `structure.json uploaded.\n`;
        if (logId) await updateServerLog(logId, { output: outputLog });

        outputLog += `> Uploading core directory to ${coreDir}...\n`;
        if (logId) await updateServerLog(logId, { output: outputLog });
        await ssh.putDirectory(localCoreDir, coreDir, { recursive: true, concurrency: 1 });
        outputLog += `core directory uploaded.\n`;

        outputLog += `> Uploading site directory to ${siteDir}...\n`;
        if (logId) await updateServerLog(logId, { output: outputLog });
        await ssh.putDirectory(localSiteDir, siteDir, { recursive: true, concurrency: 1 });
        outputLog += `site directory uploaded.\n`;

        const successMsg = outputLog + '\n--- Site data upload complete ---\n';
        console.log(successMsg);
        if (logId) await updateServerLog(logId, { status: 'completed', output: successMsg });

      } finally {
        await fs.rm(tempBaseDir, { recursive: true, force: true });
      }

    } catch (sshError: any) {
      console.error('SSH Error uploading site data:', sshError);
      const errMsg = outputLog + `\n\n--- FAILED ---\n${sshError.message}`;
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

export async function markEnvironmentsAsPending(siteId: string): Promise<void> {
  try {
    const { firestore } = initializeFirebase();
    const structureRef = doc(firestore, 'structure', siteId);
    await setDoc(structureRef, { environmentsChanged: true, status: 'pendingDeployment' }, { merge: true });
  } catch (e: any) {
    console.error("Failed to mark environments as pending:", e);
  }
}

export async function markAppBaseAsPending(siteId: string): Promise<void> {
    try {
        const { firestore } = initializeFirebase();
        const structureRef = doc(firestore, 'structure', siteId);
        await setDoc(structureRef, { appBaseChanged: true, status: 'pendingDeployment' }, { merge: true });
    } catch (e: any) {
        console.error("Failed to mark app base as pending:", e);
    }
}
