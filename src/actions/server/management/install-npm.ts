
'use server';

export async function getInstallNpmCommand(): Promise<string> {
    return 'sudo apt-get install -y nodejs npm';
}
