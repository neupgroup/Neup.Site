
'use server';

export function getCreateSwapCommand(size: string): string {
    const swapSize = parseInt(size, 10);
    if (isNaN(swapSize) || swapSize <= 0) {
        throw new Error('Invalid swap size specified.');
    }
    return `sudo fallocate -l ${swapSize}M /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile`;
}
