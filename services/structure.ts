'use server';

import { cookies } from 'next/headers';
import { db } from '@/core/lib/db';
import type { Structure, PathStructure, Deployment, Asset } from '@/schemas/asset';
import type { EnvironmentVariable } from '@/schemas/environment';
import { logErrorToDatabase } from '@/core/lib/logging';
import { getPages } from './editor/pages';
import { getAsset } from './editor/asset';
import { getPrivateServerDetails } from '@/services/servers';
import { NodeSSH } from 'node-ssh';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { createServerLog, updateServerLog } from '@/services/server-logs';
import { getAllRedirects, Redirect } from './redirects';
import { getEnvironmentVariables } from './environment';

export async function getStructure(): Promise<{ success: boolean; structure?: Structure; error?: string }> {
  const cookieStore = await cookies();
  const assetId = cookieStore.get('assetId')?.value;
  if (!assetId) return { success: false, error: 'Asset ID not found.' };

  try {
    const record = await db.siteStructure.findUnique({ where: { assetId } });
    if (!record) return { success: true, structure: undefined };

    const structure: Structure = {
      id: record.id,
      assetId: record.assetId,
      status: record.status as Structure['status'],
      structure: (record.structure as PathStructure[]) || [],
      themeChanged: record.themeChanged,
      redirectsChanged: record.redirectsChanged,
      assetsChanged: record.assetsChanged,
      appBaseChanged: record.appBaseChanged,
      environmentsChanged: record.environmentsChanged,
      updatedAt: record.updatedAt ? record.updatedAt.toISOString() : null,
    };
    return { success: true, structure };
  } catch (error: any) {
    await logErrorToDatabase({ message: `Failed to get structure: ${error.message}`, stack: error.stack, source: 'getStructure' });
    return { success: false, error: 'Failed to get structure.' };
  }
}

export async function getLastDeployment(): Promise<{ success: boolean; deployment?: Deployment; error?: string }> {
  const cookieStore = await cookies();
  const assetId = cookieStore.get('assetId')?.value;
  if (!assetId) return { success: false, error: 'Asset ID not found.' };

  try {
    const record = await db.deployment.findFirst({
      where: { assetId, status: 'deployed' },
      orderBy: { attemptedOn: 'desc' },
    });
    if (!record) return { success: true, deployment: undefined };

    const deployment: Deployment = {
      id: record.id,
      assetId: record.assetId,
      structure: (record.structure as PathStructure[]) || [],
      status: record.status as Deployment['status'],
      theme: record.theme as any,
      redirects: record.redirects as any,
      siteProfile: record.siteProfile as any,
      environments: record.environments as any,
      attemptedOn: record.attemptedOn ? record.attemptedOn.toISOString() : null,
    };
    return { success: true, deployment };
  } catch (error: any) {
    await logErrorToDatabase({ message: `Failed to get last deployment: ${error.message}`, stack: error.stack, source: 'getLastDeployment' });
    return { success: false, error: 'Failed to get last deployment.' };
  }
}

export async function buildStructure(): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies();
  const assetId = cookieStore.get('assetId')?.value;
  if (!assetId) return { success: false, error: 'Asset ID not found.' };

  try {
    const { success, pages, error } = await getPages();
    if (!success) return { success: false, error: error || 'Failed to fetch pages for build.' };

    const structureDoc: PathStructure[] = [];
    if (pages) {
      for (const page of pages) {
        if (page.paths && page.paths.length > 0) {
          for (const p of page.paths) {
            structureDoc.push({ path: p.path, pageId: page.id, sections: page.elements.map(el => el.id), theme: {}, changesMade: true });
          }
        }
      }
    }

    await db.siteStructure.upsert({
      where: { assetId },
      create: { id: assetId, assetId, structure: structureDoc as any, status: 'pendingDeployment', updatedAt: new Date() },
      update: { structure: structureDoc as any, status: 'pendingDeployment', updatedAt: new Date() },
    });

    return { success: true };
  } catch (error: any) {
    await logErrorToDatabase({ message: `Failed to build structure: ${error.message}`, stack: error.stack, source: 'buildStructure' });
    return { success: false, error: 'Failed to build asset structure.' };
  }
}

export async function createDeployment(): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies();
  const assetId = cookieStore.get('assetId')?.value;
  if (!assetId) return { success: false, error: 'Asset ID not found.' };

  try {
    const structureRecord = await db.siteStructure.findUnique({ where: { assetId } });
    if (!structureRecord) return { success: false, error: 'No structure found to deploy. Please build first.' };

    const { asset } = await getAsset();
    const currentStructure = structureRecord as unknown as Structure;

    const redirectsResult = await getAllRedirects();
    const redirects = redirectsResult.success ? redirectsResult.redirects : [];

    const envVarsResult = await getEnvironmentVariables({});
    const environments = envVarsResult.success ? envVarsResult.variables : [];

    await db.deployment.create({
      data: {
        assetId,
        structure: currentStructure.structure as any || [],
        status: 'deployed',
        theme: asset?.theme as any || {},
        redirects: redirects as any || [],
        siteProfile: { name: asset?.name || '', logoUrl: asset?.logoUrl || null, hideSitename: asset?.hideSitename || false, hideLogo: asset?.hideLogo || false } as any,
        environments: environments as any || [],
        attemptedOn: new Date(),
      },
    });

    const uploadResult = await uploadStructureToServer(assetId, currentStructure, asset || null, environments || []);
    if (!uploadResult.success) console.warn('Upload to server failed, but deployment record created:', uploadResult.error);

    const updatedPaths = (currentStructure.structure || []).map(p => ({ ...p, changesMade: false }));
    await db.siteStructure.update({
      where: { assetId },
      data: { status: 'deployed', structure: updatedPaths as any, themeChanged: false, redirectsChanged: false, assetsChanged: false, appBaseChanged: false, environmentsChanged: false, updatedAt: new Date() },
    });

    return { success: true };
  } catch (error: any) {
    await logErrorToDatabase({ message: `Failed to create deployment: ${error.message}`, stack: error.stack, source: 'createDeployment' });
    return { success: false, error: error.message || 'Failed to create deployment record.' };
  }
}

async function uploadStructureToServer(assetId: string, structure: Structure, asset: Asset | null, environments: EnvironmentVariable[]): Promise<{ success: boolean; error?: string }> {
  let logId: string | undefined;

  try {
    const allocation = await db.allocation.findFirst({ where: { assetId } });
    if (!allocation) {
      console.warn(`No server allocated for asset ${assetId}. Data not uploaded.`);
      return { success: true };
    }

    const { server, error } = await getPrivateServerDetails(allocation.serverId);
    if (error || !server || !server.publicIp || !server.privateKey) {
      return { success: false, error: error || 'Server details not found' };
    }

    const logResult = await createServerLog({ serverId: allocation.serverId, commandName: 'Deploy Asset Data', command: 'Uploading site structure, theme, redirects, and profile to server...', output: 'Starting deployment process...', status: 'pending', initiatedBy: 'system' });
    if (logResult.success && logResult.id) logId = logResult.id;

    const username = server.username || 'root';
    const resolvedAppPath = `/home/${username}/${assetId}`;
    const srcDir = `${resolvedAppPath}/src`;
    const dataDir = `${srcDir}/data`;
    const baseDir = `${resolvedAppPath}/base`;
    const coreDir = `${resolvedAppPath}/base/core`;
    const siteDir = `${resolvedAppPath}/base/site`;

    const ssh = new NodeSSH();
    let outputLog = `Connecting to ${server.publicIp} to upload data...\n`;
    if (logId) await updateServerLog(logId, { status: 'ongoing', output: outputLog });

    try {
      await ssh.connect({ host: server.publicIp, username: server.username || 'root', privateKey: server.privateKey });
      outputLog += `Connected. Preparing server directories...\n`;
      if (logId) await updateServerLog(logId, { output: outputLog });

      await ssh.execCommand(`mkdir -p ${srcDir} ${baseDir} ${coreDir} ${siteDir}`);
      await ssh.execCommand(`rm -rf ${dataDir}`);
      outputLog += 'Directories ensured and old data cleaned.\n';
      if (logId) await updateServerLog(logId, { output: outputLog });

      outputLog += '\n--- Handling .env file ---\n';
      const envPath = `${resolvedAppPath}/.env`;
      const deleteResult = await ssh.execCommand(`rm -f ${envPath}`);
      outputLog += deleteResult.code !== 0 && deleteResult.stderr ? `Warning: ${deleteResult.stderr}\n` : 'Old .env file deleted (if it existed).\n';
      if (logId) await updateServerLog(logId, { output: outputLog });

      if (environments.length > 0) {
        const envContent = environments.map(env => {
          if (env.dataType === 'string' && /\s/.test(env.value)) return `${env.name}="${env.value.replace(/"/g, '\\"')}"`;
          return `${env.name}=${env.value}`;
        }).join('\n');
        const escapedEnvContent = envContent.replace(/\\/g, '\\\\').replace(/'/g, "'\\''").replace(/`/g, '\\`');
        const createCmd = `sudo bash -c "cat > ${envPath}" <<'EOF'\n${escapedEnvContent}\nEOF`;
        outputLog += `> Writing ${environments.length} variables to ${envPath}...\n`;
        if (logId) await updateServerLog(logId, { output: outputLog });
        const createResult = await ssh.execCommand(createCmd);
        if (createResult.code !== 0) {
          outputLog += `Error creating .env file: ${createResult.stderr}\n`;
          if (logId) await updateServerLog(logId, { output: outputLog, status: 'failed' });
          throw new Error(`Failed to create .env file: ${createResult.stderr}`);
        }
        outputLog += 'New .env file created successfully.\n';
      } else {
        outputLog += 'No environment variables to create.\n';
      }
      if (logId) await updateServerLog(logId, { output: outputLog });

      const tempBaseDir = await fs.mkdtemp(path.join(os.tmpdir(), 'deployment-'));
      try {
        const redirectsResult = await getAllRedirects();
        const redirects = redirectsResult.success ? redirectsResult.redirects : [];
        const siteProfile = { name: asset?.name || '', logoUrl: asset?.logoUrl || null, hideSitename: asset?.hideSitename || false, hideLogo: asset?.hideLogo || false };

        const localCoreDir = path.join(tempBaseDir, 'core');
        const localSiteDir = path.join(tempBaseDir, 'site');
        await fs.mkdir(localCoreDir, { recursive: true });
        await fs.mkdir(localSiteDir, { recursive: true });

        await fs.writeFile(path.join(tempBaseDir, 'structure.json'), JSON.stringify(structure.structure || [], null, 2));
        await fs.writeFile(path.join(localSiteDir, 'theme.json'), JSON.stringify(asset?.theme || {}, null, 2));
        await fs.writeFile(path.join(localCoreDir, 'redirects.json'), JSON.stringify(redirects || [], null, 2));
        await fs.writeFile(path.join(localSiteDir, 'profile.json'), JSON.stringify(siteProfile, null, 2));

        await ssh.putFile(path.join(tempBaseDir, 'structure.json'), `${baseDir}/structure.json`);
        await ssh.putDirectory(localCoreDir, coreDir, { recursive: true, concurrency: 1 });
        await ssh.putDirectory(localSiteDir, siteDir, { recursive: true, concurrency: 1 });

        const successMsg = outputLog + '\n--- Asset data upload complete ---\n';
        if (logId) await updateServerLog(logId, { status: 'completed', output: successMsg });
      } finally {
        await fs.rm(tempBaseDir, { recursive: true, force: true });
      }
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
    await logErrorToDatabase({ message: `Failed to upload asset data: ${e.message}`, stack: e.stack, source: 'uploadStructureToServer' });
    return { success: false, error: e.message };
  }
}

export async function markStructureAsPending(assetId: string, paths: string[], isDeletion: boolean = false): Promise<void> {
  try {
    const record = await db.siteStructure.findUnique({ where: { assetId } });
    let finalStructure: PathStructure[] = [];

    if (record) {
      finalStructure = ((record.structure as PathStructure[]) || []).map(p => paths.includes(p.path) ? { ...p, changesMade: true } : p);
      if (isDeletion) finalStructure = finalStructure.filter(p => !paths.includes(p.path));
    } else if (!isDeletion) {
      const { pages } = await getPages();
      const pagesWithPaths = pages?.filter(p => p.paths && p.paths.some(pi => paths.includes(pi.path))) || [];
      for (const page of pagesWithPaths) {
        for (const pi of page.paths!) {
          if (paths.includes(pi.path)) {
            finalStructure.push({ path: pi.path, pageId: page.id, sections: page.elements.map(el => el.id), theme: {}, changesMade: true });
          }
        }
      }
    }

    await db.siteStructure.upsert({
      where: { assetId },
      create: { id: assetId, assetId, status: 'pendingDeployment', structure: finalStructure as any, updatedAt: new Date() },
      update: { status: 'pendingDeployment', structure: finalStructure as any, updatedAt: new Date() },
    });
  } catch (error: any) {
    await logErrorToDatabase({ message: `Failed to mark structure as pending: ${error.message}`, stack: error.stack, source: 'markStructureAsPending' });
  }
}

async function upsertStructureFlag(assetId: string, flag: Record<string, any>): Promise<void> {
  await db.siteStructure.upsert({
    where: { assetId },
    create: { id: assetId, assetId, status: 'pendingDeployment', ...flag },
    update: { status: 'pendingDeployment', ...flag },
  });
}

export async function markAssetsAsPending(assetId: string): Promise<void> {
  try { await upsertStructureFlag(assetId, { assetsChanged: true }); } catch (e: any) { console.error('Failed to mark assets as pending:', e); }
}

export async function markThemeAsPending(assetId: string): Promise<void> {
  try { await upsertStructureFlag(assetId, { themeChanged: true }); } catch (e: any) { console.error('Failed to mark theme as pending:', e); }
}

export async function markRedirectsAsPending(assetId: string): Promise<void> {
  try { await upsertStructureFlag(assetId, { redirectsChanged: true }); } catch (e: any) { console.error('Failed to mark redirects as pending:', e); }
}

export async function markEnvironmentsAsPending(assetId: string): Promise<void> {
  try { await upsertStructureFlag(assetId, { environmentsChanged: true }); } catch (e: any) { console.error('Failed to mark environments as pending:', e); }
}

export async function markAppBaseAsPending(assetId: string): Promise<void> {
  try { await upsertStructureFlag(assetId, { appBaseChanged: true }); } catch (e: any) { console.error('Failed to mark app base as pending:', e); }
}
