"use server";

interface NginxConfigParams {
  urls: string[];
  proxyUrl: string;
  listenPort: number;
}

export async function getConfigureNginxCommand({ urls, proxyUrl, listenPort }: NginxConfigParams): Promise<string> {
  if (urls.length === 0) throw new Error('At least one URL is required.');

  const firstUrl = new URL(urls[0].startsWith('http') ? urls[0] : `http://${urls[0]}`);
  const primaryDomain = firstUrl.hostname.replace(/\./g, '_');
  const primaryPath = firstUrl.pathname.replace(/\//g, '_').replace(/^_/, '');
  const safeDomain = primaryPath ? `${primaryDomain}_${primaryPath}` : primaryDomain;
  const configFileName = `${safeDomain}.conf`;

  const allDomains = new Set<string>();
  const locations = new Map<string, string>();

  urls.forEach(urlStr => {
    const url = new URL(urlStr.startsWith('http') ? urlStr : `http://${urlStr}`);
    allDomains.add(url.hostname);
    const path = url.pathname === '/' && urlStr.endsWith('/') ? '/' : (url.pathname || '/');

    if (!locations.has(path)) {
      locations.set(path, `
    location ${path} {
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
`);
    }
  });

  const serverName = Array.from(allDomains).join(' ');
  const locationBlocks = Array.from(locations.values()).join('\n');

  const config = `server {
    listen ${listenPort};
    server_name ${serverName};
${locationBlocks}
}`;

  // FIX: Increased escaping for the dollar sign
  const escapedConfig = config.replace(/"/g, '\\"').replace(/\$/g, '\\\\$');

  return `
sudo mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled &&
sudo bash -c "echo \\"${escapedConfig}\\" > /etc/nginx/sites-available/${configFileName}" &&
sudo ln -s -f /etc/nginx/sites-available/${configFileName} /etc/nginx/sites-enabled/${configFileName} &&
sudo nginx -t &&
sudo systemctl reload nginx
`.trim();
}