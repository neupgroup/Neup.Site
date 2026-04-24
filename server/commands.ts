

'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { ServerCommand, serverCommandSchema } from '@/schemas/command';
import { logErrorToDatabase } from '@/lib/logging';
import { getConfigureNginxCommand } from './server/management/configure-nginx';
import { getInstallCertbotNginxCommand } from './server/management/install-certbot-nginx';

async function createBuiltInCommands() {
    const commandsToCreate = [
        {
            id: 'app-start-prod',
            data: {
                name: "Start Application (Production)",
                description: "Builds, starts, and configures a Next.js app on an Ubuntu server using PM2 and Nginx with SSL.",
                commandTemplate: `
<server.ubuntuBashProcessor>
set -e
echo "--- Starting Application Deployment ---"

APP_NAME="{{universal.site_id}}"
APP_PATH="/home/$(whoami)/{{universal.site_id}}"

echo "--- Step 1: Navigating to application directory $APP_PATH ---"
cd $APP_PATH

echo "--- Step 2: Cleaning old dependencies ---"
rm -rf node_modules

echo "--- Step 3: Installing packages ---"
npm install

echo "--- Step 4: Building application ---"
NODE_OPTIONS="--max_old_space_size=4096" npm run build

echo "--- Step 5: Starting application with PM2 on port {{universal.app_port}} ---"
(pm2 list | grep -q "$APP_NAME" && pm2 delete "$APP_NAME") || echo "No old PM2 process to delete."
pm2 start "npm start -- -p {{universal.app_port}}" --name "$APP_NAME" --update-env --time

echo "--- Step 6: Saving PM2 process list ---"
pm2 save

echo "--- Step 7: Configuring Nginx reverse proxy ---"
echo "--- Deleting old Nginx configs if they exist ---"
sudo rm -f /etc/nginx/sites-available/{{universal.site_id}}.conf
sudo rm -f /etc/nginx/sites-enabled/{{universal.site_id}}.conf
echo "--- Creating new Nginx config ---"
sudo bash -c "cat > /etc/nginx/sites-available/{{universal.site_id}}.conf" <<'EOF'
server {
    listen 80;
    server_name {{universal.productionDomain}};

    location / {
        proxy_pass http://localhost:{{universal.app_port}};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
sudo ln -s -f /etc/nginx/sites-available/{{universal.site_id}}.conf /etc/nginx/sites-enabled/
sudo nginx -t

echo "--- Step 8: Setting up SSL with Certbot and enabling auto-redirect ---"
sudo certbot --nginx --non-interactive --agree-tos --email encryption.sites@neupgroup.com -d {{universal.productionDomain}} --redirect

sudo systemctl reload nginx

echo "--- Deployment Complete ---"
</server.ubuntuBashProcessor>
                `,
                parameters: [],
                allocatesPort: true,
                type: 'creation',
                danger: 'high',
            }
        },
        {
            id: 'initial-server-setup',
            data: {
                name: "Initial Server Setup",
                description: "Installs Nginx and Certbot, and configures a default redirect to neupgroup.com/cloud.",
                commandTemplate: `
<server.ubuntuBashProcessor>
set -e
echo "--- Updating package list ---"
sudo apt-get update

echo "--- Installing Nginx and Certbot ---"
sudo apt-get install -y nginx certbot python3-certbot-nginx

echo "--- Configuring default catch-all redirect ---"
sudo rm -f /etc/nginx/sites-enabled/default
sudo bash -c "cat > /etc/nginx/sites-available/default-catch-all" <<'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    return 301 https://neupgroup.com/cloud;
}
EOF
sudo ln -sf /etc/nginx/sites-available/default-catch-all /etc/nginx/sites-enabled/

echo "--- Restarting Nginx ---"
sudo systemctl restart nginx
echo "--- Initial Setup Complete ---"
</server.ubuntuBashProcessor>
                `,
                type: 'creation',
                danger: 'mid'
            }
        },
        {
            id: 'install-requisites', data: {
                name: "Install Requisites",
                description: "Installs Node.js and npm on an Ubuntu server.",
                commandTemplate: "sudo apt-get update && sudo apt-get install -y nodejs npm",
                type: 'updation',
                danger: 'mid'
            }
        },
        {
            id: 'install-packages',
            data: {
                name: "Install Packages",
                description: "Runs 'npm install' in the application directory.",
                commandTemplate: `cd /home/$(whoami)/{{universal.site_id}} && npm install`,
                type: 'updation',
                danger: 'low'
            }
        },
        {
            id: 'build-app',
            data: {
                name: "Build App",
                description: "Clean build: removes node_modules and .next, then runs npm install and build.",
                commandTemplate: `cd /home/$(whoami)/{{universal.site_id}} && echo "Cleaning old build..." && rm -rf .next node_modules && echo "Installing dependencies..." && npm install && echo "Building application..." && NODE_OPTIONS="--max_old_space_size=4096" npm run build`,
                type: 'updation',
                danger: 'low',
                nextCommands: ['restart-app'] // Automatically restart app after successful build
            }
        },
        {
            id: 'start-app-and-configure-proxy', data: {
                name: "Start App & Configure Proxy",
                description: "Deletes old PM2 instances, starts a new one on an available port, saves it, and configures Nginx with an SSL redirect.",
                commandTemplate: `
cd /home/$(whoami)/{{universal.site_id}}
(pm2 list | grep -q '{{universal.site_id}}' && pm2 delete '{{universal.site_id}}') || echo "No old processes to delete."
pm2 start "npm start -- -p {{universal.app_port}}" --name "{{universal.site_id}}" --update-env --time
pm2 save

echo "--- Deleting old Nginx configs if they exist ---"
sudo rm -f /etc/nginx/sites-available/{{universal.site_id}}.conf
sudo rm -f /etc/nginx/sites-enabled/{{universal.site_id}}.conf
echo "--- Creating new Nginx config ---"

sudo bash -c "cat > /etc/nginx/sites-available/{{universal.site_id}}.conf" <<'EOF'
server {
    listen 80;
    server_name {{universal.productionDomain}};

    location / {
        proxy_pass http://localhost:{{universal.app_port}};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
sudo ln -s -f /etc/nginx/sites-available/{{universal.site_id}}.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo certbot --nginx --non-interactive --agree-tos --email encryption.sites@neupgroup.com -d {{universal.productionDomain}} --redirect
sudo systemctl reload nginx
            `,
                type: 'updation',
                danger: 'mid',
                allocatesPort: true
            }
        },
        {
            id: 'restart-app', data: {
                name: "Restart App",
                description: "Restarts the PM2 process for the application.",
                commandTemplate: `
cd /home/$(whoami)/{{universal.site_id}}
pm2 restart {{universal.site_id}} || echo "Process not found, starting fresh..."
pm2 save
            `,
                type: 'updation',
                danger: 'low'
            }
        },
        {
            id: 'generate-reverse-proxy',
            data: {
                name: "Generate Reverse Proxy Config",
                description: "Generates and applies an Nginx reverse proxy configuration for a specific path to a target IP and port.",
                commandTemplate: `<server.generateReverseProxy>{{universal.productionDomain}}</server.generateReverseProxy>`,
                type: 'updation',
                danger: 'mid',
                parameters: [
                    {
                        key: 'path',
                        label: 'Proxy Path',
                        description: 'The path on the domain to proxy (e.g., / or /api).',
                        type: 'text',
                        required: true,
                        defaultValue: '/'
                    },
                    {
                        key: 'serverIp',
                        label: 'Target Server IP',
                        description: 'The IP address of the target server.',
                        type: 'text',
                        required: true
                    },
                    {
                        key: 'port',
                        label: 'Target Port',
                        description: 'The port on the target server.',
                        type: 'text',
                        required: true
                    },
                    {
                        key: 'ignoredPaths',
                        label: 'Ignored Paths',
                        description: 'Comma-separated list of paths to exclude from proxying (e.g., /static, /images).',
                        type: 'text',
                        required: false
                    }
                ]
            }
        }
    ];

    for (const cmd of commandsToCreate) {
        try {
            await db.serverCommand.upsert({
                where: { id: cmd.id },
                create: {
                    id: cmd.id,
                    name: cmd.data.name,
                    description: cmd.data.description ?? null,
                    commandTemplate: cmd.data.commandTemplate,
                    parameters: cmd.data.parameters ? (cmd.data.parameters as any) : undefined,
                    preExecutionScript: (cmd.data as any).preExecutionScript ?? null,
                    allocatesPort: Boolean((cmd.data as any).allocatesPort),
                    portToReserve: (cmd.data as any).portToReserve ?? null,
                    type: (cmd.data as any).type ?? 'view',
                    danger: (cmd.data as any).danger ?? 'low',
                    nextCommands: (cmd.data as any).nextCommands ? ((cmd.data as any).nextCommands as any) : undefined,
                    createdAt: new Date(),
                },
                update: {
                    name: cmd.data.name,
                    description: cmd.data.description ?? null,
                    commandTemplate: cmd.data.commandTemplate,
                    parameters: cmd.data.parameters ? (cmd.data.parameters as any) : undefined,
                    preExecutionScript: (cmd.data as any).preExecutionScript ?? null,
                    allocatesPort: Boolean((cmd.data as any).allocatesPort),
                    portToReserve: (cmd.data as any).portToReserve ?? null,
                    type: (cmd.data as any).type ?? 'view',
                    danger: (cmd.data as any).danger ?? 'low',
                    nextCommands: (cmd.data as any).nextCommands ? ((cmd.data as any).nextCommands as any) : undefined,
                },
            });
        } catch (e) {
            console.error(`Failed to upsert built-in command "${cmd.id}"`, e);
        }
    }
}


// Immediately try to create the built-in command when this module is loaded.
// This is a simple way to ensure it exists. A more robust system might use a migration script.
void createBuiltInCommands();

export async function createServerCommand(data: Omit<ServerCommand, 'id' | 'createdAt'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
        const validatedData = serverCommandSchema.omit({ id: true, createdAt: true }).safeParse(data);
        if (!validatedData.success) {
            const errorDetails = validatedData.error.flatten().fieldErrors;
            return { success: false, error: JSON.stringify(errorDetails) };
        }

        const record = await db.serverCommand.create({
            data: {
                name: validatedData.data.name,
                description: validatedData.data.description ?? null,
                commandTemplate: validatedData.data.commandTemplate,
                parameters: validatedData.data.parameters ? (validatedData.data.parameters as any) : undefined,
                preExecutionScript: (validatedData.data as any).preExecutionScript ?? null,
                allocatesPort: Boolean((validatedData.data as any).allocatesPort),
                portToReserve: (validatedData.data as any).portToReserve ?? null,
                type: (validatedData.data as any).type ?? 'view',
                danger: (validatedData.data as any).danger ?? 'low',
                nextCommands: (validatedData.data as any).nextCommands ? ((validatedData.data as any).nextCommands as any) : undefined,
                createdAt: new Date(),
            },
            select: { id: true },
        });

        return { success: true, id: record.id };
    } catch (e: any) {
        await logErrorToDatabase({ message: `Failed to create server command: ${e.message}`, stack: e.stack, source: 'createServerCommand' });
        return { success: false, error: 'Failed to create command.' };
    }
}

export async function getServerCommands({
    searchQuery,
    page = 1,
    pageSize = 10
}: {
    searchQuery?: string;
    page?: number;
    pageSize?: number;
}): Promise<{ success: boolean; commands?: ServerCommand[]; error?: string; totalCount?: number }> {
    try {
        const where = searchQuery
            ? {
                OR: [
                    { name: { contains: searchQuery, mode: 'insensitive' as const } },
                    { description: { contains: searchQuery, mode: 'insensitive' as const } },
                ],
            }
            : {};

        const [totalCount, records] = await Promise.all([
            db.serverCommand.count({ where }),
            db.serverCommand.findMany({
                where,
                orderBy: [{ name: 'asc' }, { id: 'asc' }],
                skip: Math.max(0, page - 1) * pageSize,
                take: pageSize,
            }),
        ]);

        const commands = records.map((record) => ({
            id: record.id,
            name: record.name,
            description: record.description ?? undefined,
            commandTemplate: record.commandTemplate,
            parameters: (record.parameters as any) || [],
            preExecutionScript: record.preExecutionScript ?? undefined,
            type: (record.type as any) || 'view',
            danger: (record.danger as any) || 'low',
            allocatesPort: record.allocatesPort ?? false,
            portToReserve: record.portToReserve ?? undefined,
            nextCommands: (record.nextCommands as any) || [],
            createdAt: record.createdAt ? record.createdAt.toISOString() : null,
        })) as ServerCommand[];

        return { success: true, commands, totalCount };
    } catch (e: any) {
        await logErrorToDatabase({ message: `Failed to get server commands: ${e.message}`, stack: e.stack, source: 'getServerCommands' });
        return { success: false, error: 'Failed to fetch commands.' };
    }
}

export async function getServerCommand(id: string): Promise<{ success: boolean; command?: ServerCommand; error?: string }> {
    try {
        const record = await db.serverCommand.findUnique({ where: { id } });
        if (!record) {
            return { success: false, error: 'Command not found.' };
        }

        const command: ServerCommand = {
            id: record.id,
            name: record.name,
            description: record.description ?? undefined,
            commandTemplate: record.commandTemplate,
            parameters: (record.parameters as any) || [],
            preExecutionScript: record.preExecutionScript ?? undefined,
            type: (record.type as any) || 'view',
            danger: (record.danger as any) || 'low',
            allocatesPort: record.allocatesPort ?? false,
            portToReserve: record.portToReserve ?? undefined,
            nextCommands: (record.nextCommands as any) || [],
            createdAt: record.createdAt ? record.createdAt.toISOString() : null,
        };
        return { success: true, command };

    } catch (e: any) {
        await logErrorToDatabase({ message: `Failed to get server command ${id}: ${e.message}`, stack: e.stack, source: 'getServerCommand' });
        return { success: false, error: 'Failed to fetch command.' };
    }
}

export async function updateServerCommand(id: string, data: Partial<Omit<ServerCommand, 'id' | 'createdAt'>>): Promise<{ success: boolean; error?: string }> {
    try {
        const validatedData = serverCommandSchema.partial().safeParse(data);
        if (!validatedData.success) {
            const errorDetails = validatedData.error.flatten().fieldErrors;
            return { success: false, error: JSON.stringify(errorDetails) };
        }

        await db.serverCommand.update({
            where: { id },
            data: {
                ...(validatedData.data.name !== undefined ? { name: validatedData.data.name } : {}),
                ...(validatedData.data.description !== undefined ? { description: validatedData.data.description ?? null } : {}),
                ...(validatedData.data.commandTemplate !== undefined ? { commandTemplate: validatedData.data.commandTemplate } : {}),
                ...(validatedData.data.parameters !== undefined ? { parameters: (validatedData.data.parameters as any) ?? null } : {}),
                ...((validatedData.data as any).preExecutionScript !== undefined
                    ? { preExecutionScript: (validatedData.data as any).preExecutionScript ?? null }
                    : {}),
                ...((validatedData.data as any).type !== undefined ? { type: (validatedData.data as any).type ?? 'view' } : {}),
                ...((validatedData.data as any).danger !== undefined ? { danger: (validatedData.data as any).danger ?? 'low' } : {}),
                ...((validatedData.data as any).allocatesPort !== undefined
                    ? { allocatesPort: Boolean((validatedData.data as any).allocatesPort) }
                    : {}),
                ...((validatedData.data as any).portToReserve !== undefined
                    ? { portToReserve: (validatedData.data as any).portToReserve ?? null }
                    : {}),
                ...((validatedData.data as any).nextCommands !== undefined
                    ? { nextCommands: ((validatedData.data as any).nextCommands as any) ?? null }
                    : {}),
            },
        });

        return { success: true };
    } catch (e: any) {
        await logErrorToDatabase({ message: `Failed to update server command ${id}: ${e.message}`, stack: e.stack, source: 'updateServerCommand' });
        return { success: false, error: 'Failed to update command.' };
    }
}

export async function deleteServerCommand(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await db.serverCommand.delete({ where: { id } });

        return { success: true };
    } catch (e: any) {
        await logErrorToDatabase({ message: `Failed to delete server command ${id}: ${e.message}`, stack: e.stack, source: 'deleteServerCommand' });
        return { success: false, error: 'Failed to delete command.' };
    }
}



