

export function getFreePort80Command(): string {
    return 'sudo lsof -t -i:80 | xargs -r sudo kill -9';
}
