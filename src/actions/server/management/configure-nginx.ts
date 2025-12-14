"use server";

import { getSite } from "@/actions/editor/site";

interface NginxConfigParams {
  urls: string[];
  proxyUrl: string;
  listenPort: number;
}

export async function getConfigureNginxCommand({ urls, proxyUrl, listenPort }: NginxConfigParams): Promise<string> {
    if (urls.length === 0) {
        throw new Error('At least one URL is required.');
    }

    const { site } = await getSite();
    const forceHttps = site?.domainSettings?.forceHttps ?? true;
    const redirectToNonWww = site?.domainSettings?.redirectToNonWww ?? true;

    const firstUrl = new URL(urls[0].startsWith('http') ? urls[0] : `http://${urls[0]}`);
    const primaryDomain = firstUrl.hostname.replace('www.', ''); // Get non-www version
    const safeDomain = primaryDomain.replace(/\./g, '_');
    const configFileName = `${safeDomain}.conf`;

    const allDomains = new Set<string>();
    urls.forEach(urlStr => {
        const url = new URL(urlStr.startsWith('http') ? urlStr : `http://${urlStr}`);
        allDomains.add(url.hostname);
    });
    const serverName = Array.from(allDomains).join(' ');

    const locationBlock = `
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
    }`;

    let nginxConfig = '';

    // Main HTTPS server block
    let httpsServerBlock = `
server {
    listen ${listenPort} ssl;
    server_name ${serverName};

    ssl_certificate /etc/letsencrypt/live/${primaryDomain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${primaryDomain}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    ${redirectToNonWww ? `
    if ($host = www.${primaryDomain}) {
        return 301 https://${primaryDomain}$request_uri;
    }` : ''}
    ${locationBlock}
}
`;

    // HTTP redirect block (if forcing HTTPS)
    if (forceHttps) {
        const httpRedirectBlock = `
server {
    listen 80;
    server_name ${serverName};
    return 301 https://$host$request_uri;
}
`;
        nginxConfig += httpRedirectBlock;
    }

    nginxConfig += httpsServerBlock;
    
    const configFilePath = `/etc/nginx/sites-available/${configFileName}`;
    const enabledConfigPath = `/etc/nginx/sites-enabled/${configFileName}`;

    const command = `
sudo mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled && \\
sudo bash -c "cat > ${configFilePath}" <<'EOF'
${nginxConfig}
EOF
sudo ln -s -f ${configFilePath} ${enabledConfigPath} && \\
sudo nginx -t && \\
sudo systemctl reload nginx
`.trim();

    return command;
}
