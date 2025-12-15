"use server";

import { getSite } from "@/actions/editor/site";

interface NginxConfigParams {
    urls: string[];
    proxyUrl: string;
    listenPort: number;
}

/**
 * Creates a general HTTPS server block for a domain
 */
function createGeneralServerBlock(domain: string, proxyUrl: string, listenPort: number): string {
    return `
server {
    listen ${listenPort} ssl;
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

export async function getConfigureNginxCommand({ urls, proxyUrl, listenPort }: NginxConfigParams): Promise<string> {
    if (urls.length === 0) {
        throw new Error('At least one URL is required.');
    }

    const { site } = await getSite();

    // Process each URL and create domain-specific configurations
    const domainConfigs: string[] = [];
    const processedDomains = new Set<string>();

    for (const urlStr of urls) {
        const url = new URL(urlStr.startsWith('http') ? urlStr : `http://${urlStr}`);
        const domain = url.hostname;

        // Skip if we've already processed this domain
        if (processedDomains.has(domain)) {
            continue;
        }
        processedDomains.add(domain);

        // Find the matching domain settings from the site's domains array
        const domainConfig = site?.domains?.find(d => d.value === domain);

        const forceHttps = domainConfig?.forceHttps ?? true;

        // Step 1: Create the blocks for this domain
        const generalBlock = createGeneralServerBlock(domain, proxyUrl, listenPort);
        const httpsRedirectBlock = createHttpsRedirectBlock(domain);

        // Step 2: Combine blocks based on what's needed for this domain
        let domainNginxConfig = '';

        // Add HTTPS redirect if needed
        if (forceHttps) {
            domainNginxConfig += httpsRedirectBlock + '\n';
        }

        // Always add the general server block
        domainNginxConfig += generalBlock + '\n';

        // Step 3: Save this domain's configuration
        domainConfigs.push(domainNginxConfig);
    }

    // Step 4: Merge all domain configurations
    const mergedNginxConfig = domainConfigs.join('\n');

    // Step 5: Create the final deployment script
    const firstDomain = new URL(urls[0].startsWith('http') ? urls[0] : `http://${urls[0]}`).hostname;
    const safeDomain = firstDomain.replace(/\./g, '_');
    const configFileName = `${safeDomain}.conf`;
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
