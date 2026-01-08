
export function generateReverseProxyBashScript(
    domain: string,
    proxyPath: string,
    targetIp: string,
    targetPort: string,
    ignoredPaths: string[] = []
): string {
    const safeDomain = domain.replace(/[^a-zA-Z0-9.-]/g, ''); // Basic sanitization
    const configPath = `/etc/nginx/sites-available/${safeDomain}`;
    // const enabledPath = `/etc/nginx/sites-enabled/${safeDomain}`; // Not used since we use ln -s -f locally in the script ? No, we need it.

    // Allow overriding protocol if targetIp contains it, else default to http
    if (!targetIp || !targetPort) {
        throw new Error('Target IP and Port are required for reverse proxy configuration.');
    }
    const protocol = targetIp.startsWith('http') ? '' : 'http://';
    const upstreamUrl = `${protocol}${targetIp}:${targetPort}`;

    let ignoredLocations = '';

    // Sort ignored paths by length desc to ensure most specific match wins if nginx logic applies, 
    // though exact match or prefix match order in file matters.
    // We will place ignored paths BEFORE the main proxy path to ensure they take precedence if they overlap.
    for (const path of ignoredPaths) {
        if (!path.trim()) continue;
        ignoredLocations += `
    location ${path} {
        try_files $uri $uri/ =404;
    }
`;
    }

    // Main proxy location
    // If proxyPath is not root, we need to ensure correct handling
    const proxyLocation = `
    location ${proxyPath} {
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

    // Full Config
    const nginxConfig = `server {
    listen 80;
    server_name ${safeDomain};

    root /var/www/${safeDomain};
    index index.html index.htm;

    ${ignoredLocations}
    ${proxyLocation}
}`;

    // Bash Script Creation
    // We use a bash heredoc to write the file
    // We also include commands to enable and reload
    const script = `
echo "--- Configuring Reverse Proxy for ${safeDomain} ---"
echo "Target: ${upstreamUrl}, Path: ${proxyPath}"

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
