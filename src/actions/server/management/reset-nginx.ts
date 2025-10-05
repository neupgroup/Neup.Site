
'use server';

export async function getResetNginxCommand(): Promise<string> {
    return 'sudo rm -f /etc/nginx/sites-available/*.conf && sudo rm -f /etc/nginx/sites-enabled/* && sudo systemctl restart nginx';
}
