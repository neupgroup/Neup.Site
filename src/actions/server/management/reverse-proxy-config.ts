
export interface ProxyConfig {
    path: string;
    ip: string;
    port: string;
}

export function generateReverseProxyBashScript(
    domain: string,
    proxies: ProxyConfig[],
    ignoredPaths: string[] = []
): string {
    const safeDomain = domain.replace(/[^a-zA-Z0-9.-]/g, ''); // Basic sanitization
    const configPath = `/etc/nginx/sites-available/${safeDomain}`;

    if (!proxies || proxies.length === 0) {
        throw new Error('At least one proxy configuration (Path, IP, Port) is required.');
    }

    let proxyLocations = '';

    // Sort proxies by path length desc to ensuring specific paths take precedence over root
    const sortedProxies = [...proxies].sort((a, b) => b.path.length - a.path.length);

    for (const proxy of sortedProxies) {
        if (!proxy.ip || !proxy.port) {
            continue; // Skip invalid configs
        }
        const protocol = proxy.ip.startsWith('http') ? '' : 'http://';
        const upstreamUrl = `${protocol}${proxy.ip}:${proxy.port}`;

        proxyLocations += `
    location ${proxy.path} {
        proxy_pass ${upstreamUrl};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
`;
    }

    let ignoredLocations = '';
    for (const path of ignoredPaths) {
        if (!path.trim()) continue;
        ignoredLocations += `
    location ${path} {
        try_files $uri $uri/ =404;
    }
`;
    }

    // Full Config
    const nginxConfig = `server {
    listen 80;
    server_name ${safeDomain};

    root /var/www/${safeDomain};
    index index.html index.htm;

    ${ignoredLocations}
    ${proxyLocations}
}`;

    // Bash Script Creation
    // We use a bash heredoc to write the file
    // We also include commands to enable and reload
    const script = `
echo "--- Configuring Reverse Proxy for ${safeDomain} ---"
echo "Generating configuration for provided proxies..."

# Remove existing config
sudo rm -f ${configPath}
sudo rm -f /etc/nginx/sites-enabled/${safeDomain}

# Write new config
sudo bash -c "cat > ${configPath}" <<'EOF_NGINX_CONFIG'
${nginxConfig}
EOF_NGINX_CONFIG

# Enable config
sudo ln -sf ${configPath} /etc/nginx/sites-enabled/

# Test and Reload
if sudo nginx -t; then
    sudo systemctl reload nginx
    echo "--- Nginx configuration reloaded successfully ---"
    
    # Optional: Run Certbot if requested? User didn't specify. 
    # But usually we want SSL. For now we stick to HTTP as requested or minimal scope.
else
    echo "--- Nginx configuration test FAILED. Reverting... ---"
    sudo rm -f /etc/nginx/sites-enabled/${safeDomain}
    sudo systemctl reload nginx
    exit 1
fi
`;

    return script;
}
