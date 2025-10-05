'use server';

interface BuildParams {
  memory: string;
  path: string;
}

export async function getBuildNpmWithMemoryCommand({ memory, path }: BuildParams): Promise<string> {
  const memoryLimit = parseInt(memory, 10);
  if (isNaN(memoryLimit) || memoryLimit <= 0) {
    throw new Error('Invalid memory size specified.');
  }
  if (!path || path.trim() === '' || !path.startsWith('/')) {
      throw new Error('A valid, absolute deployment path is required.');
  }

  // Basic path sanitization
  const sanitizedPath = path.replace(/[^a-zA-Z0-9\/_.-~]/g, '');

  return `cd ${sanitizedPath} && NODE_OPTIONS=--max-old-space-size=${memoryLimit} npm install && npm run build`;
}
