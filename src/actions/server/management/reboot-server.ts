
'use server';

export async function getRebootServerCommand(): Promise<string> {
    return 'sudo reboot';
}
