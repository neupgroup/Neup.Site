'use server';

import { runCommand } from '@/actions/runner';

export interface Domain {
    value: string;
    forceHttps?: boolean;
}

export interface NginxConfigResult {
    success: boolean;
    error?: string;
    message?: string;
    config?: string;
}

/**
 * Generates nginx configuration for a domain based on its settings
 */
function generateDomainConfig(domain: Domain, sslCertPath?: string, sslKeyPath?: string): string {
    const domainName = domain.value;
    const forceHttps = domain.forceHttps ?? true;

    let config = '';

    // HTTP Server Block
    if (forceHttps) {
        // Redirect all HTTP to HTTPS
        config += `server {
    listen 80;
    listen [::]:80;
    server_name ${domainName};
    return 301 https://${domainName}$request_uri;
}

`;
    } else {
        // Serve HTTP normally
        config += `server {
    listen 80;
    listen [::]:80;
    server_name ${domainName};
    
    root /var/www/${domainName};
    index index.html index.htm;
    
    location / {
        try_files $uri $uri/ =404;
    }
}

`;
    }

    // HTTPS Server Block (if forcing HTTPS or if SSL certs are provided)
    if (forceHttps || (sslCertPath && sslKeyPath)) {
        // Main HTTPS server
        config += `server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name ${domainName};
    
    ssl_certificate ${sslCertPath || '/etc/nginx/ssl/default.crt'};
    ssl_certificate_key ${sslKeyPath || '/etc/nginx/ssl/default.key'};
    
    root /var/www/${domainName};
    index index.html index.htm;
    
    location / {
        try_files $uri $uri/ =404;
    }
}

`;
    }

    return config;
}

/**
 * Generates and deploys nginx configuration for all domains
 */
export async function generateNginxConfig(
    serverId: string,
    domains: Domain[]
): Promise<NginxConfigResult> {
    try {
        if (!domains || domains.length === 0) {
            return {
                success: false,
                error: 'No domains configured',
                message: 'Please add at least one domain before generating nginx configuration'
            };
        }

        // Generate configuration for all domains
        let fullConfig = '# Generated Nginx Configuration\n';
        fullConfig += '# Auto-generated based on domain settings\n\n';

        for (const domain of domains) {
            fullConfig += `# Configuration for ${domain.value}\n`;
            fullConfig += generateDomainConfig(domain);
        }

        // Create backup of existing config
        const backupCommand = `
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup.$(date +%s) 2>/dev/null || true
`.trim();

        await runCommand(serverId, backupCommand, {}, 'Backup Existing Nginx Config');

        // Write new configuration
        const configCommand = `
sudo bash -c "cat > /etc/nginx/sites-available/default" <<'EOF'
${fullConfig}
EOF
sudo ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default
`.trim();

        const configResult = await runCommand(serverId, configCommand, {}, 'Write Nginx Configuration');

        if (!configResult.success) {
            return {
                success: false,
                error: 'Failed to write nginx configuration',
                message: configResult.error || 'Unknown error occurred while writing configuration'
            };
        }

        // Test nginx configuration
        const testCommand = 'sudo nginx -t';
        const testResult = await runCommand(serverId, testCommand, {}, 'Test Nginx Configuration');

        if (!testResult.success) {
            // Restore backup
            await runCommand(
                serverId,
                'sudo cp /etc/nginx/sites-available/default.backup.* /etc/nginx/sites-available/default 2>/dev/null || true',
                {},
                'Restore Nginx Backup'
            );

            return {
                success: false,
                error: 'Nginx configuration test failed',
                message: 'Configuration has syntax errors. Previous configuration has been restored.'
            };
        }

        // Reload nginx
        const reloadCommand = 'sudo systemctl reload nginx';
        const reloadResult = await runCommand(serverId, reloadCommand, {}, 'Reload Nginx');

        if (!reloadResult.success) {
            return {
                success: false,
                error: 'Failed to reload nginx',
                message: reloadResult.error || 'Configuration is valid but nginx failed to reload'
            };
        }

        return {
            success: true,
            message: `Nginx configuration successfully generated and deployed for ${domains.length} domain(s)`,
            config: fullConfig
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
 * Previews the nginx configuration without deploying it
 */
export async function previewNginxConfig(domains: Domain[]): Promise<NginxConfigResult> {
    try {
        if (!domains || domains.length === 0) {
            return {
                success: false,
                error: 'No domains configured',
                message: 'Please add at least one domain before previewing configuration'
            };
        }

        let fullConfig = '# Generated Nginx Configuration\n';
        fullConfig += '# Auto-generated based on domain settings\n\n';

        for (const domain of domains) {
            fullConfig += `# Configuration for ${domain.value}\n`;
            fullConfig += generateDomainConfig(domain);
        }

        return {
            success: true,
            config: fullConfig,
            message: 'Configuration preview generated successfully'
        };

    } catch (error) {
        return {
            success: false,
            error: 'Unexpected error',
            message: error instanceof Error ? error.message : 'An unexpected error occurred'
        };
    }
}
