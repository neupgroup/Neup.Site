
'use server';

export async function getFreePort80Command(): Promise<string> {
    return 'sudo lsof -t -i:80 | xargs -r sudo kill -9';
}
