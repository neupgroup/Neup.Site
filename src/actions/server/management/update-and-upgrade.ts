
'use server';

export function getUpdateAndUpgradeCommand(): string {
    return 'sudo apt-get update && sudo apt-get upgrade -y';
}
