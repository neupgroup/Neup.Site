'use server';

export async function getInstallPm2Command(): Promise<string> {
  return 'sudo npm install -g pm2';
}
