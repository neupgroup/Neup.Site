
'use server';

import { getActiveProjectId } from '@/services/projects';
import { prisma as db } from '#/core/database/prisma';
import { logger } from '#/logica/logger';
import type {
  CodeFile,
  CodebaseBrowserData,
  CodebaseDirectoryEntry,
  CodebaseFileEntry,
  CodebaseSelectedFile,
} from '@/services/codebase/type';

const CODEBASE_FOLDER_MARKER = '.neup-folder';

function normalizeCodeFilePath(input: string): string | null {
  const trimmed = input.trim().replace(/\\/g, '/').replace(/^\/+/, '');
  if (!trimmed || trimmed.includes('\0')) return null;

  const segments = trimmed.split('/').filter(Boolean);
  if (!segments.length || segments.some((segment) => segment === '.' || segment === '..')) {
    return null;
  }

  return segments.join('/');
}

function isFolderMarkerPath(path: string) {
  return path.endsWith(`/${CODEBASE_FOLDER_MARKER}`) || path === CODEBASE_FOLDER_MARKER;
}

function isFolderMarkerName(name: string) {
  return name === CODEBASE_FOLDER_MARKER;
}

function getBreadcrumbs(path: string | null) {
  const breadcrumbs = [{ name: 'Codebase', path: null as string | null }];

  if (!path) {
    return breadcrumbs;
  }

  const segments = path.split('/').filter(Boolean);
  let currentPath = '';

  for (const segment of segments) {
    currentPath = currentPath ? `${currentPath}/${segment}` : segment;
    breadcrumbs.push({ name: segment, path: currentPath });
  }

  return breadcrumbs;
}

function getParentPath(path: string | null): string | null {
  if (!path) return null;

  const segments = path.split('/').filter(Boolean);
  if (segments.length <= 1) return null;

  return segments.slice(0, -1).join('/');
}

export async function uploadCodeFile(fileData: Omit<CodeFile, 'id' | 'createdAt' | 'assetId'>) {
  const assetId = await getActiveProjectId();
  if (!assetId) return { success: false, error: 'Asset ID not found.' };

  try {
    const normalizedPath = normalizeCodeFilePath(fileData.filePath);
    if (!normalizedPath) return { success: false, error: 'Invalid file path.' };

    const record = await db.codeFile.create({
      data: { ...fileData, assetId, filePath: normalizedPath, createdAt: new Date() },
      select: { id: true },
    });
    return { success: true, id: record.id };
  } catch (error: any) {
    await logger.error({ message: `Failed to upload code file: ${error.message}`, source: 'uploadCodeFile' });
    return { success: false, error: error.message || 'Failed to upload file.' };
  }
}

export async function saveCodeFileByPath(params: {
  filePath: string;
  content: string;
  fileName?: string;
}): Promise<{ success: boolean; id?: string; error?: string; created?: boolean }> {
  const assetId = await getActiveProjectId();
  if (!assetId) return { success: false, error: 'Asset ID not found.' };

  const normalizedPath = normalizeCodeFilePath(params.filePath);
  if (!normalizedPath) return { success: false, error: 'Invalid file path.' };

  const fileName = params.fileName?.trim() || normalizedPath.split('/').pop() || normalizedPath;
  const size = Buffer.byteLength(params.content, 'utf-8');
  const encodedContent = Buffer.from(params.content, 'utf-8').toString('base64');

  try {
    const existing = await db.codeFile.findFirst({
      where: { assetId, filePath: normalizedPath },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      await db.codeFile.update({
        where: { id: existing.id },
        data: {
          fileName,
          filePath: normalizedPath,
          content: encodedContent,
          size,
        },
      });

      return { success: true, id: existing.id, created: false };
    }

    const created = await db.codeFile.create({
      data: {
        assetId,
        fileName,
        filePath: normalizedPath,
        content: encodedContent,
        size,
        createdAt: new Date(),
      },
      select: { id: true },
    });

    return { success: true, id: created.id, created: true };
  } catch (error: any) {
    await logger.error({ message: `Failed to save code file at path ${normalizedPath}: ${error.message}`, source: 'saveCodeFileByPath' });
    return { success: false, error: error.message || 'Failed to save file.' };
  }
}

export async function createCodeFolder(folderPath: string): Promise<{ success: boolean; error?: string }> {
  const assetId = await getActiveProjectId();
  if (!assetId) return { success: false, error: 'Asset ID not found.' };

  const normalizedPath = normalizeCodeFilePath(folderPath);
  if (!normalizedPath) return { success: false, error: 'Invalid folder path.' };

  const markerPath = `${normalizedPath}/${CODEBASE_FOLDER_MARKER}`;

  try {
    const existing = await db.codeFile.findFirst({
      where: {
        assetId,
        OR: [
          { filePath: normalizedPath },
          { filePath: markerPath },
          { filePath: { startsWith: `${normalizedPath}/` } },
        ],
      },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      return { success: false, error: 'Folder already exists.' };
    }

    await db.codeFile.create({
      data: {
        assetId,
        fileName: CODEBASE_FOLDER_MARKER,
        filePath: markerPath,
        content: '',
        size: 0,
        createdAt: new Date(),
      },
      select: { id: true },
    });

    return { success: true };
  } catch (error: any) {
    await logger.error({ message: `Failed to create code folder at path ${normalizedPath}: ${error.message}`, source: 'createCodeFolder' });
    return { success: false, error: error.message || 'Failed to create folder.' };
  }
}

export async function getCodeFiles({ page = 1, pageSize = 10 }: { page?: number, pageSize?: number }): Promise<{ success: boolean; files?: CodeFile[]; error?: string; totalCount?: number }> {
  const assetId = await getActiveProjectId();
  if (!assetId) return { success: false, error: 'Asset ID not found.' };

  try {
    const [totalCount, records] = await Promise.all([
      db.codeFile.count({ where: { assetId } }),
      db.codeFile.findMany({
        where: { assetId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const files: CodeFile[] = records.map(r => ({
      id: r.id,
      assetId: r.assetId,
      fileName: r.fileName,
      filePath: r.filePath,
      content: r.content,
      size: r.size,
      createdAt: r.createdAt ? r.createdAt.toISOString() : null,
    } as CodeFile));

    return { success: true, files, totalCount };
  } catch (error: any) {
    await logger.error({ message: `Failed to get code files: ${error.message}`, source: 'getCodeFiles' });
    return { success: false, error: error.message || 'Failed to fetch files.' };
  }
}

export async function getCodebaseBrowser(path?: string | null): Promise<{ success: boolean; data?: CodebaseBrowserData; error?: string }> {
  const assetId = await getActiveProjectId();
  if (!assetId) return { success: false, error: 'Asset ID not found.' };

  const normalizedPath = path ? normalizeCodeFilePath(path) : null;
  if (path && !normalizedPath) {
    return { success: false, error: 'Invalid path.' };
  }

  try {
    const records = await db.codeFile.findMany({
      where: { assetId },
      orderBy: [{ filePath: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        assetId: true,
        fileName: true,
        filePath: true,
        size: true,
        createdAt: true,
      },
    });

    const latestFilesByPath = new Map<string, CodeFile>();
    for (const record of records) {
      if (latestFilesByPath.has(record.filePath)) continue;

      latestFilesByPath.set(record.filePath, {
        id: record.id,
        assetId: record.assetId,
        fileName: record.fileName,
        filePath: record.filePath,
        content: '',
        size: record.size,
        createdAt: record.createdAt ? record.createdAt.toISOString() : null,
      });
    }

    const uniqueFiles = Array.from(latestFilesByPath.values());
    const currentPath = normalizedPath;
    const currentPrefix = currentPath ? `${currentPath}/` : '';
    const currentDepth = currentPath ? currentPath.split('/').filter(Boolean).length : 0;
    const exactFile = currentPath ? latestFilesByPath.get(currentPath) : undefined;
    const exactVisibleFile = exactFile && !isFolderMarkerName(exactFile.fileName) ? exactFile : undefined;
    const folderChildren = uniqueFiles.filter((file) => {
      if (!currentPrefix) return true;
      return file.filePath.startsWith(currentPrefix);
    });

    if (currentPath && !exactVisibleFile && folderChildren.length === 0) {
      return { success: false, error: 'Path not found.' };
    }

    if (exactVisibleFile) {
      const record = await db.codeFile.findFirst({
        where: { assetId, filePath: exactVisibleFile.filePath },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fileName: true,
          filePath: true,
          size: true,
          content: true,
          createdAt: true,
        },
      });

      if (!record) {
        return { success: false, error: 'File not found.' };
      }

      const selectedFile: CodebaseSelectedFile = {
        id: record.id,
        name: record.fileName || record.filePath.split('/').pop() || record.filePath,
        path: record.filePath,
        size: record.size,
        createdAt: record.createdAt ? record.createdAt.toISOString() : null,
        content: Buffer.from(record.content, 'base64').toString('utf-8'),
      };

      return {
        success: true,
        data: {
          currentPath,
          parentPath: getParentPath(currentPath),
          breadcrumbs: getBreadcrumbs(currentPath),
          directories: [],
          files: [],
          totalFileCount: uniqueFiles.filter((file) => !isFolderMarkerName(file.fileName)).length,
          selectedFile,
        },
      };
    }

    const directoriesByPath = new Map<string, CodebaseDirectoryEntry>();
    const files: CodebaseFileEntry[] = [];

    for (const file of folderChildren) {
      const relativePath = currentPrefix ? file.filePath.slice(currentPrefix.length) : file.filePath;
      const segments = relativePath.split('/').filter(Boolean);
      if (!segments.length) continue;
      const isMarkerFile = isFolderMarkerPath(file.filePath);

      if (segments.length === 1) {
        if (isMarkerFile) continue;

        files.push({
          id: file.id,
          name: file.fileName || segments[0],
          path: file.filePath,
          size: file.size,
          createdAt: file.createdAt,
        });
        continue;
      }

      const directoryName = segments[0];
      const directoryPath = currentPath ? `${currentPath}/${directoryName}` : directoryName;
      const existing = directoriesByPath.get(directoryPath);
      const fileCountDelta = isMarkerFile ? 0 : 1;
      const sizeDelta = isMarkerFile ? 0 : file.size;

      if (existing) {
        existing.fileCount += fileCountDelta;
        existing.totalSize += sizeDelta;
        continue;
      }

      directoriesByPath.set(directoryPath, {
        name: directoryName,
        path: directoryPath,
        fileCount: fileCountDelta,
        totalSize: sizeDelta,
      });
    }

    const directories = Array.from(directoriesByPath.values()).sort((left, right) => left.name.localeCompare(right.name));
    files.sort((left, right) => {
      const depthDelta = left.path.split('/').length - right.path.split('/').length;
      if (depthDelta !== 0) return depthDelta;
      return left.name.localeCompare(right.name);
    });

    return {
      success: true,
      data: {
        currentPath,
        parentPath: currentDepth > 0 ? getParentPath(currentPath) : null,
        breadcrumbs: getBreadcrumbs(currentPath),
        directories,
        files,
        totalFileCount: uniqueFiles.filter((file) => !isFolderMarkerName(file.fileName)).length,
      },
    };
  } catch (error: any) {
    await logger.error({ message: `Failed to browse codebase: ${error.message}`, source: 'getCodebaseBrowser' });
    return { success: false, error: error.message || 'Failed to browse codebase.' };
  }
}

export async function deleteCodeFile(id: string) {
  const assetId = await getActiveProjectId();
  if (!assetId) return { success: false, error: 'Asset ID not found.' };

  try {
    const existing = await db.codeFile.findFirst({ where: { id, assetId } });
    if (!existing) return { success: false, error: 'File not found or unauthorized.' };
    await db.codeFile.delete({ where: { id } });
    return { success: true };
  } catch (error: any) {
    await logger.error({ message: `Failed to delete code file ${id}: ${error.message}`, source: 'deleteCodeFile' });
    return { success: false, error: error.message || 'Failed to delete file.' };
  }
}
