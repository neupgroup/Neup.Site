
'use server';

import * as fs from 'fs/promises';
import * as path from 'path';
import { revalidatePath } from 'next/cache';
import { logErrorToFirestore } from '@/lib/logging';

export interface PublicFile {
  name: string;
  path: string; // Relative path from /public
  fullPath: string; // Absolute server path
  type: 'file' | 'directory';
  size?: number; // in bytes
  modified?: Date;
}

// Ensure the base directory is the `public` directory of the project
const PUBLIC_DIR = path.join(process.cwd(), 'public');

/**
 * Gets the list of files and directories within a given path inside the public folder.
 */
export async function getPublicFiles(directoryPath: string = '/'): Promise<{ success: boolean; files?: PublicFile[]; error?: string }> {
    const sanitizedPath = path.join(PUBLIC_DIR, directoryPath).replace(/\\/g, '/');

    // Security: Ensure the resolved path is still within the PUBLIC_DIR
    if (!sanitizedPath.startsWith(PUBLIC_DIR)) {
        return { success: false, error: 'Access denied. Path is outside the public directory.' };
    }
    
    try {
        await fs.access(sanitizedPath); // Check if directory exists
        const items = await fs.readdir(sanitizedPath, { withFileTypes: true });
        const files: PublicFile[] = await Promise.all(
            items.map(async item => {
                const fullPath = path.join(sanitizedPath, item.name);
                const stats = await fs.stat(fullPath);
                return {
                    name: item.name,
                    path: path.join(directoryPath, item.name).replace(/\\/g, '/'),
                    fullPath: fullPath,
                    type: item.isDirectory() ? 'directory' : 'file',
                    size: stats.size,
                    modified: stats.mtime,
                };
            })
        );
        
        files.sort((a, b) => {
            if (a.type === 'directory' && b.type !== 'directory') return -1;
            if (a.type !== 'directory' && b.type === 'directory') return 1;
            return a.name.localeCompare(b.name);
        });

        return { success: true, files };
    } catch (e: any) {
        if (e.code === 'ENOENT') {
             return { success: true, files: [] }; // Directory doesn't exist, return empty
        }
        await logErrorToFirestore({ message: `Failed to read public directory at ${directoryPath}: ${e.message}`, source: 'getPublicFiles' });
        return { success: false, error: `Could not read directory. ${e.message}` };
    }
}

/**
 * Uploads a file to a specific path within the public folder.
 */
export async function uploadPublicFile(relativePath: string, content: string, fileName: string): Promise<{ success: boolean; error?: string }> {
    // Sanitize the relative path: remove leading/trailing slashes
    const cleanRelativePath = relativePath.replace(/^\/|\/$/g, '');

    const fullPath = path.join(PUBLIC_DIR, cleanRelativePath, fileName);

    // Security Check
    if (!fullPath.startsWith(PUBLIC_DIR)) {
        return { success: false, error: 'Access denied. Invalid file path.' };
    }

    try {
        const fileContent = Buffer.from(content, 'base64');
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, fileContent);
        revalidatePath('/site/uploads');
        return { success: true };
    } catch (e: any) {
        await logErrorToFirestore({ message: `Failed to upload file to ${fullPath}: ${e.message}`, source: 'uploadPublicFile' });
        return { success: false, error: 'File upload failed.' };
    }
}


/**
 * Deletes a file or directory from the public folder.
 */
export async function deletePublicFile(relativePath: string): Promise<{ success: boolean; error?: string }> {
    const fullPath = path.join(PUBLIC_DIR, relativePath);

    if (!fullPath.startsWith(PUBLIC_DIR) || fullPath === PUBLIC_DIR) {
        return { success: false, error: 'Access denied. Cannot delete root public folder.' };
    }

    try {
        const stats = await fs.stat(fullPath);
        if (stats.isDirectory()) {
            await fs.rm(fullPath, { recursive: true, force: true });
        } else {
            await fs.unlink(fullPath);
        }
        revalidatePath('/site/uploads');
        return { success: true };
    } catch (e: any) {
        await logErrorToFirestore({ message: `Failed to delete path ${relativePath}: ${e.message}`, source: 'deletePublicFile' });
        return { success: false, error: 'Failed to delete path.' };
    }
}
