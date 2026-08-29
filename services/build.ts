import { prisma as db } from '#/core/database/prisma';
import { logger } from '#/logica/logger';
import { convertJsonToHtml } from '@/inapp/helpers/json-to-html';

const CODEBASE_FOLDER_MARKER = '.neup-folder';

type BuildMapFile = {
  path: string;
  size: number;
  version: number;
};

type BuildFileResult =
  | {
      success: true;
      content: string;
      contentType: string;
    }
  | {
      success: false;
      error: string;
      status: 400 | 404 | 500;
    };

/*
::neup.documentation::build-service

::public

Resolves build manifests and site-scoped file content for public build endpoints.

::public end
::end
*/

function normalizeCodeFilePath(input: string): string | null {
  const trimmed = input.trim().replace(/\\/g, '/').replace(/^\/+/, '');
  if (!trimmed || trimmed.includes('\0')) return null;

  const segments = trimmed.split('/').filter(Boolean);
  if (!segments.length || segments.some((segment) => segment === '.' || segment === '..')) {
    return null;
  }

  return segments.join('/');
}

function normalizeRoutePath(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed || trimmed.includes('\0')) return null;

  const prefixed = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const segments = prefixed.split('/').filter(Boolean);
  if (segments.some((segment) => segment === '.' || segment === '..')) {
    return null;
  }

  return segments.length ? `/${segments.join('/')}` : '/';
}

function isFolderMarkerPath(path: string) {
  return path.endsWith(`/${CODEBASE_FOLDER_MARKER}`) || path === CODEBASE_FOLDER_MARKER;
}

function getContentType(filePath: string): string {
  const extension = filePath.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'js':
    case 'mjs':
    case 'cjs':
      return 'application/javascript; charset=utf-8';
    case 'json':
      return 'application/json; charset=utf-8';
    case 'css':
      return 'text/css; charset=utf-8';
    case 'html':
      return 'text/html; charset=utf-8';
    case 'svg':
      return 'image/svg+xml';
    case 'txt':
      return 'text/plain; charset=utf-8';
    case 'xml':
      return 'application/xml; charset=utf-8';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    default:
      return 'application/octet-stream';
  }
}

export async function getBuildMap(siteId: string): Promise<{ success: true; buildMap: BuildMapFile[] } | { success: false; error: string }> {
  try {
    const asset = await db.asset.findUnique({
      where: { id: siteId },
      select: { id: true },
    });

    if (!asset) {
      return { success: false, error: 'Site not found.' };
    }

    const codeFiles = await db.codeFile.findMany({
      where: {
        assetId: siteId,
        NOT: [
          { filePath: CODEBASE_FOLDER_MARKER },
          { filePath: { endsWith: `/${CODEBASE_FOLDER_MARKER}` } },
        ],
      },
      orderBy: [{ filePath: 'asc' }, { createdAt: 'asc' }],
      select: { filePath: true, size: true },
    });

    const fileVersions = new Map<string, number>();

    return {
      success: true,
      buildMap: codeFiles.map((entry) => {
        const version = (fileVersions.get(entry.filePath) ?? 0) + 1;
        fileVersions.set(entry.filePath, version);

        return {
          path: entry.filePath,
          size: entry.size,
          version,
        };
      }),
    };
  } catch (error: any) {
    await logger.error({
      message: `Failed to build buildmap for site ${siteId}: ${error.message}`,
      stack: error.stack,
      source: 'getBuildMap',
    });
    return { success: false, error: 'Failed to load build map.' };
  }
}

export async function getBuildFile(siteId: string, requestedPath: string): Promise<BuildFileResult> {
  const codeFilePath = normalizeCodeFilePath(requestedPath);
  const routePath = normalizeRoutePath(requestedPath);

  if (!codeFilePath && !routePath) {
    return { success: false, error: 'Invalid path parameter.', status: 400 };
  }

  try {
    if (codeFilePath) {
      if (isFolderMarkerPath(codeFilePath)) {
        return { success: false, error: 'File not found.', status: 404 };
      }

      const codeFile = await db.codeFile.findFirst({
        where: { assetId: siteId, filePath: codeFilePath },
        select: { content: true, filePath: true },
      });

      if (codeFile) {
        return {
          success: true,
          content: Buffer.from(codeFile.content, 'base64').toString('utf-8'),
          contentType: getContentType(codeFile.filePath),
        };
      }
    }

    if (routePath) {
      const pagePath = await db.pagePath.findFirst({
        where: { assetId: siteId, path: routePath },
        select: { pageId: true },
      });

      if (pagePath) {
        const [page, theme] = await Promise.all([
          db.page.findUnique({
            where: { id: pagePath.pageId },
            select: { elements: true },
          }),
          db.theme.findUnique({
            where: { id: siteId },
            select: { theme: true },
          }),
        ]);

        if (!page) {
          return { success: false, error: 'Page not found.', status: 404 };
        }

        return {
          success: true,
          content: convertJsonToHtml(page.elements as any, theme?.theme as any),
          contentType: 'text/html; charset=utf-8',
        };
      }
    }

    return { success: false, error: 'File not found.', status: 404 };
  } catch (error: any) {
    await logger.error({
      message: `Failed to resolve build file for site ${siteId} at path ${requestedPath}: ${error.message}`,
      stack: error.stack,
      source: 'getBuildFile',
    });
    return { success: false, error: 'Failed to load file.', status: 500 };
  }
}
