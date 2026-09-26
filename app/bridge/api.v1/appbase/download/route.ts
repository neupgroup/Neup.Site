import { NextResponse } from 'next/server';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { prisma as db } from '@neup/core/database/prisma';
import { getActiveProjectId } from '@/services/projects';
import { getAsset } from '@/services/editor/asset';
import { getEnvironmentVariables } from '@/services/environment';
import { getStructure } from '@/services/structure';

const execFileAsync = promisify(execFile);

function formatEnvValue(value: string, dataType: string) {
  if (dataType === 'string' && /\s/.test(value)) {
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  return value;
}

export async function GET() {
  let temporaryDirectory: string | undefined;

  try {
    const assetId = await getActiveProjectId();
    if (!assetId) return NextResponse.json({ error: 'Asset context not found.' }, { status: 400 });

    const [{ asset, error: assetError }, structureResult, environmentResult, appBaseBackups] = await Promise.all([
      getAsset(),
      getStructure(),
      getEnvironmentVariables({ page: 1, pageSize: 10000 }),
      db.appBaseBackup.findMany({
        where: { assetId },
        orderBy: [{ fileType: 'asc' }, { fileName: 'asc' }],
        select: { fileName: true, fileType: true, content: true },
      }),
    ]);

    if (assetError || !asset) throw new Error(assetError || 'Could not load asset data.');
    if (!structureResult.success) throw new Error(structureResult.error || 'Could not load structure.');
    if (!environmentResult.success) throw new Error(environmentResult.error || 'Could not load environments.');

    temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'basefile-'));
    const structureDirectory = path.join(temporaryDirectory, 'structure');
    const assetsDirectory = path.join(temporaryDirectory, 'assets');
    const appbaseDirectory = path.join(temporaryDirectory, 'appbase');
    await Promise.all([
      fs.mkdir(structureDirectory, { recursive: true }),
      fs.mkdir(assetsDirectory, { recursive: true }),
      fs.mkdir(appbaseDirectory, { recursive: true }),
    ]);

    await Promise.all([
      fs.writeFile(path.join(structureDirectory, 'structure.json'), JSON.stringify(structureResult.structure?.structure || [], null, 2)),
      fs.writeFile(path.join(temporaryDirectory, 'theme.json'), JSON.stringify(asset.theme || {}, null, 2)),
      fs.copyFile(path.join(process.cwd(), '@base', 'modules.json'), path.join(temporaryDirectory, 'modules.json')),
      fs.writeFile(path.join(assetsDirectory, 'assets.json'), JSON.stringify({
        id: asset.id,
        name: asset.name,
        logoUrl: asset.logoUrl || null,
        icons: asset.icons || {},
        domains: asset.domains || {},
        modules: asset.modules || {},
        features: asset.features || {},
      }, null, 2)),
      fs.writeFile(path.join(temporaryDirectory, 'appbase.json'), JSON.stringify(appBaseBackups, null, 2)),
      fs.writeFile(path.join(temporaryDirectory, '.env'), (environmentResult.variables || [])
        .map((variable) => `${variable.name}=${formatEnvValue(variable.value, variable.dataType)}`)
        .join('\n') + '\n'),
      ...appBaseBackups.map((backup) => fs.writeFile(
        path.join(appbaseDirectory, backup.fileType, backup.fileName),
        backup.content,
      ).catch(async () => {
        await fs.mkdir(path.dirname(path.join(appbaseDirectory, backup.fileType, backup.fileName)), { recursive: true });
        await fs.writeFile(path.join(appbaseDirectory, backup.fileType, backup.fileName), backup.content);
      })),
    ]);

    const archivePath = path.join(os.tmpdir(), `basefile-${asset.id}.zip`);
    await execFileAsync('zip', ['-qr', archivePath, '.'], { cwd: temporaryDirectory });
    const archive = await fs.readFile(archivePath);
    await fs.rm(archivePath, { force: true });

    return new NextResponse(archive, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="basefile.zip"',
        'Content-Length': String(archive.byteLength),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Could not create base files archive.' }, { status: 500 });
  } finally {
    if (temporaryDirectory) await fs.rm(temporaryDirectory, { recursive: true, force: true });
  }
}
