
'use server';

export async function getInstallNginxCommand(): Promise<string> {
  return 'sudo apt-get install -y nginx && sudo systemctl start nginx && sudo systemctl enable nginx';
}
