

export function getResetNginxCommand(): string {
    return 'sudo rm -f /etc/nginx/sites-available/*.conf && sudo rm -f /etc/nginx/sites-enabled/* && sudo systemctl restart nginx';
}
