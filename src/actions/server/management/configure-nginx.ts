"use server";

interface NginxConfigParams {
  urls: string[];
  proxyUrl: string;
  listenPort: number;
}

export async function getConfigureNginxCommand({ urls, proxyUrl, listenPort }: NginxConfigParams): Promise<string> {
  if (urls.length === 0) {
    throw new Error('At least one URL is required.');
  }

  // --- 1. Process and build the complete Nginx configuration string first ---

  const firstUrl = new URL(urls[0].startsWith('http') ? urls[0] : `http://${urls[0]}`);
  const primaryDomain = firstUrl.hostname.replace(/\./g, '_');
  const primaryPath = firstUrl.pathname.replace(/\//g, '_').replace(/^_/, '');
  const safeDomain = primaryPath ? `${primaryDomain}_${primaryPath}` : primaryDomain;
  const configFileName = `${safeDomain}.conf`;

  const allDomains = new Set<string>();
  const locations = new Map<string, string>();

  // Process all URLs to gather unique domains and create location blocks
  urls.forEach(urlStr => {
    const url = new URL(urlStr.startsWith('http') ? urlStr : `http://${urlStr}`);
    allDomains.add(url.hostname);
    const path = url.pathname === '/' && urlStr.endsWith('/') ? '/' : (url.pathname || '/');

    // Create a location block for each unique path
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
    }`);
    }
  });

  const serverName = Array.from(allDomains).join(' ');
  const locationBlocks = Array.from(locations.values()).join('');

  // The final Nginx configuration string is now complete
  const nginxConfig = `server {
    listen ${listenPort};
    server_name ${serverName};
${locationBlocks}
}
`;

  // --- 2. Create the shell command to save the finalized string to a file ---

  const configFilePath = `/etc/nginx/sites-available/${configFileName}`;
  const enabledConfigPath = `/etc/nginx/sites-enabled/${configFileName}`;

  // Use a 'here-document' (cat <<'EOF') to write the string.
  // Quoting 'EOF' prevents the shell from expanding variables (like $http_upgrade) inside the block.
  // This is a much safer way to write multi-line content with special characters.
  const command = `
sudo mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled &&
sudo bash -c "cat > ${configFilePath}" <<'EOF'
${nginxConfig}
EOF
sudo ln -s -f ${configFilePath} ${enabledConfigPath} &&
sudo nginx -t &&
sudo systemctl reload nginx
`.trim();

  return command;
}