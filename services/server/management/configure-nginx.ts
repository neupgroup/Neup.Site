
"use server";

import { getAsset } from "@/services/editor/asset";
import type { DomainSetting } from '@/schemas/asset';

interface NginxConfigParams {
    urls: string[];
    proxyUrl: string;
    listenPort: number;
}

/**
 * Creates a general HTTPS server block for a domain
 */
function createGeneralServerBlock(domain: string, proxyUrl: string): string {
    return `
server {
    listen 443 ssl http2;
    server_name ${domain};

    ssl_certificate /etc/letsencrypt/live/${domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${domain}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass ${proxyUrl};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}`;
}

/**
 * Creates an HTTP to HTTPS redirect block for a domain
 */
function createHttpsRedirectBlock(domain: string): string {
    return `
server {
    listen 80;
    server_name ${domain};
    return 301 https://$host$request_uri;
}`;
}


export async function getConfigureNginxCommand({ proxyUrl, listenPort }: Omit<NginxConfigParams, 'urls'>): Promise<string> {
    const { asset } = await getAsset();

    const domainSettings = asset?.domains ?? asset?.domainSettings;
    if (!domainSettings) {
        throw new Error('No domain settings found for the asset.');
    }
    
    const domains: { url: string; forceHttps?: boolean }[] = [];
    if (domainSettings.production?.url) domains.push({ url: domainSettings.production.url, forceHttps: domainSettings.production.forceHttps });
    if (domainSettings.development?.url) domains.push({ url: domainSettings.development.url, forceHttps: domainSettings.development.forceHttps });
    if ((domainSettings as any).staging?.url) domains.push({ url: (domainSettings as any).staging.url, forceHttps: (domainSettings as any).staging.forceHttps });

    if (domains.length === 0) {
        throw new Error('At least one domain must be configured.');
    }

    const domainConfigs: string[] = [];

    for (const domainInfo of domains) {
        const domain = domainInfo.url;
        const forceHttps = domainInfo.forceHttps ?? true;
        
        let domainNginxConfig = '';

        if (forceHttps) {
            domainNginxConfig += createHttpsRedirectBlock(domain) + '\n';
        }

        domainNginxConfig += createGeneralServerBlock(domain, proxyUrl) + '\n';

        domainConfigs.push(domainNginxConfig);
    }

    const mergedNginxConfig = domainConfigs.join('\n');
    const safeDomainName = (asset?.id || 'asset').replace(/[^a-zA-Z0-9]/g, '_');
    const configFileName = `${safeDomainName}.conf`;
    const configFilePath = `/etc/nginx/sites-available/${configFileName}`;
    const enabledConfigPath = `/etc/nginx/sites-enabled/${configFileName}`;

    const command = `
sudo mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled && \\
sudo bash -c "cat > ${configFilePath}" <<'EOF'
${mergedNginxConfig}
EOF
sudo ln -s -f ${configFilePath} ${enabledConfigPath} && \\
sudo nginx -t && \\
sudo systemctl reload nginx
`.trim();

    return command;
}
