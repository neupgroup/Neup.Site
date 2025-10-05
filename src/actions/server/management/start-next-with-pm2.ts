'use server';

interface StartParams {
  appName: string;
  path: string;
}

export async function getStartNextWithPm2Command({ appName, path }: StartParams): Promise<string> {
  if (!appName || appName.trim() === '') {
    throw new Error('An application name is required.');
  }
  if (!path || path.trim() === '' || !path.startsWith('/')) {
    throw new Error('A valid, absolute deployment path is required.');
  }

  // Basic sanitization
  const sanitizedPath = path.replace(/[^a-zA-Z0-9\/_.-~]/g, '');
  const sanitizedAppName = appName.replace(/[^a-zA-Z0-9_-]/g, '');

  return `cd ${sanitizedPath} && pm2 start npm --name "${sanitizedAppName}" -- run start`;
}
