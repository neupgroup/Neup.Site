'use server';

import { runCommand } from '@/actions/runner';

export interface ConfigureDefaultNginxResult {
    success: boolean;
    error?: string;
    message?: string;
}

/**
 * Configures the default nginx configuration to redirect all traffic to neupgroup.com/cloud
 * This includes creating SSL certificates and setting up both HTTP and HTTPS redirects
 */
export async function configureDefaultNginx(serverId: string): Promise<ConfigureDefaultNginxResult> {
    try {
        // Step 1: Create SSL directory and generate self-signed certificate
        const sslCommand = `
sudo mkdir -p /etc/nginx/ssl && \\
sudo openssl req -x509 -nodes -days 3650 \\
  -newkey rsa:2048 \\
  -keyout /etc/nginx/ssl/default.key \\
  -out /etc/nginx/ssl/default.crt \\
  -subj "/CN=neupgroup-default"
`.trim();

        const sslResult = await runCommand(serverId, sslCommand, {}, 'Create Default SSL Certificate');

        if (!sslResult.success) {
            return {
                success: false,
                error: 'Failed to create SSL certificate',
                message: sslResult.error || 'Unknown error occurred while creating SSL certificate'
            };
        }

        // Step 2: Create the default nginx configuration
        const nginxConfig = `server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    return 301 https://neupgroup.com/cloud;
}

server {
    listen 443 ssl default_server;
    listen [::]:443 ssl default_server;
    server_name _;

    ssl_certificate     /etc/nginx/ssl/default.crt;
    ssl_certificate_key /etc/nginx/ssl/default.key;

    return 301 https://neupgroup.com/cloud;
}`;

        const configCommand = `
sudo bash -c "cat > /etc/nginx/sites-available/default" <<'EOF'
${nginxConfig}
EOF
sudo ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default && \\
sudo nginx -t && \\
sudo systemctl reload nginx
`.trim();

        const configResult = await runCommand(serverId, configCommand, {}, 'Configure Default Nginx');

        if (!configResult.success) {
            return {
                success: false,
                error: 'Failed to configure nginx',
                message: configResult.error || 'Unknown error occurred while configuring nginx'
            };
        }

        return {
            success: true,
            message: 'Default nginx configuration successfully applied'
        };

    } catch (error) {
        return {
            success: false,
            error: 'Unexpected error',
            message: error instanceof Error ? error.message : 'An unexpected error occurred'
        };
    }
}

/**
 * Checks if the default nginx configuration is already set up
 */
export async function checkDefaultNginxStatus(serverId: string): Promise<{
    success: boolean;
    configured: boolean;
    error?: string;
}> {
    try {
        // Check if SSL certificates and config file exist
        const checkCommand = `
if [ -f /etc/nginx/ssl/default.crt ] && \\
   [ -f /etc/nginx/ssl/default.key ] && \\
   [ -f /etc/nginx/sites-available/default ] && \\
   grep -q "neupgroup.com/cloud" /etc/nginx/sites-available/default 2>/dev/null; then
    exit 0
else
    exit 1
fi
`.trim();

        const result = await runCommand(serverId, checkCommand, {}, 'Check Default Nginx Status');

        // If the command succeeded (exit 0), it means all files exist and config is correct
        const configured = result.success && result.finalStatus === 'completed';

        return {
            success: true,
            configured
        };

    } catch (error) {
        return {
            success: false,
            configured: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
