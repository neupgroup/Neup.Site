
'use server';

export async function getUpdateAndUpgradeCommand(): Promise<string> {
    return 'sudo apt-get update && sudo apt-get upgrade -y';
}
