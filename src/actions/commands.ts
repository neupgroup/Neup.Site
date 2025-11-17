

'use server';

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  Timestamp,
  deleteDoc,
  serverTimestamp,
  addDoc,
  query,
  orderBy,
  limit,
  startAfter,
  getCountFromServer,
  where,
} from 'firebase/firestore';
import { initializeFirebase } from '@/lib/firebase';
import { revalidatePath } from 'next/cache';
import { ServerCommand, serverCommandSchema } from '@/schemas/command';
import { logErrorToFirestore } from '@/lib/logging';
import { getConfigureNginxCommand } from './server/management/configure-nginx';
import { getInstallCertbotNginxCommand } from './server/management/install-certbot-nginx';

async function createBuiltInCommands() {
    const { firestore } = initializeFirebase();

    const commandsToCreate = [
        {
            id: 'app-start-prod',
            data: {
                name: "Start Next.js App (Production)",
                description: "Builds, starts, and configures a Next.js app on an Ubuntu server using PM2 and Nginx with SSL.",
                commandTemplate: `
<server.ubuntuBashProcessor>
set -e
echo "--- Starting Application Deployment ---"

cleanup() {
    echo "--- Cleaning up swap file ---"
    if [ -f /swapfile ]; then
        sudo swapoff /swapfile
        sudo rm -f /swapfile
        echo "Swap file removed."
    fi
}
trap cleanup EXIT

echo "--- Step 1: Creating 4GB swap file ---"
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo "Swap file created and activated."

echo "--- Step 2: Building application in {{universal.server_appPath}} ---"
cd {{universal.server_appPath}}
npm install
npm run build

echo "--- Step 3: Starting application with PM2 on port {{universal.server_reservedPort}} ---"
pm2 start "npm start -- -p {{universal.server_reservedPort}}" --name "{{universal.site_id}}.{{universal.server_reservedPort}}" --update-env
pm2 save

echo "--- Step 4: Configuring Nginx reverse proxy ---"
sudo bash -c "cat > /etc/nginx/sites-available/{{universal.site_id}}.conf" <<'EOF'
server {
    listen 80;
    server_name {{universal.site_domain}};

    location / {
        proxy_pass http://localhost:{{universal.server_reservedPort}};
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

echo "--- Step 5: Setting up SSL with Certbot ---"
sudo certbot --nginx --non-interactive --agree-tos --email encryption.sites@neupgroup.com -d {{universal.site_domain}} --redirect

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
        { id: 'install-requisites', data: { name: "Install Requisites", description: "Installs Node.js and npm on an Ubuntu server.", commandTemplate: "sudo apt-get update && sudo apt-get install -y nodejs npm", type: 'updation', danger: 'mid' } },
        { id: 'install-packages', data: { name: "Install Packages", description: "Runs 'npm install' in the application directory.", commandTemplate: "cd {{universal.server_appPath}} && npm install", type: 'updation', danger: 'low' } },
        { id: 'build-app', data: { name: "Build App", description: "Runs 'npm run build' in the application directory.", commandTemplate: "cd {{universal.server_appPath}} && npm run build", type: 'updation', danger: 'low' } },
        { id: 'run-app', data: { name: "Run App", description: "Starts the application with PM2.", commandTemplate: "pm2 start \"npm start -- -p {{universal.server_reservedPort}}\" --name \"{{universal.site_id}}.{{universal.server_reservedPort}}\" --update-env", type: 'updation', danger: 'mid' } },
        { id: 'run-permanently', data: { name: "Run Permanently", description: "Saves the current PM2 process list to persist after reboots.", commandTemplate: "pm2 save", type: 'updation', danger: 'low' } },
        { id: 'make-config', data: { name: "Make Nginx Config", description: "Creates and enables an Nginx config file for the site.", commandTemplate: `
sudo bash -c "cat > /etc/nginx/sites-available/{{universal.site_id}}.conf" <<'EOF'
server {
    listen 80;
    server_name {{universal.site_domain}};

    location / {
        proxy_pass http://localhost:{{universal.server_reservedPort}};
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
sudo certbot --nginx --non-interactive --agree-tos --email encryption.sites@neupgroup.com -d {{universal.site_domain}} --redirect
sudo systemctl reload nginx
        `, type: 'updation', danger: 'mid' } },
    ];

    for (const cmd of commandsToCreate) {
        try {
            const docRef = doc(firestore, 'serverCommands', cmd.id);
            await setDoc(docRef, {
                ...cmd.data,
                createdAt: serverTimestamp(),
            }, { merge: true });
        } catch(e) {
            console.error(`Failed to upsert built-in command "${cmd.id}"`, e);
        }
    }
}


// Immediately try to create the built-in command when this module is loaded.
// This is a simple way to ensure it exists. A more robust system might use a migration script.
createBuiltInCommands();

export async function createServerCommand(data: Omit<ServerCommand, 'id' | 'createdAt'>): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const validatedData = serverCommandSchema.omit({ id: true, createdAt: true }).safeParse(data);
    if (!validatedData.success) {
      const errorDetails = validatedData.error.flatten().fieldErrors;
      return { success: false, error: JSON.stringify(errorDetails) };
    }

    const { firestore } = initializeFirebase();
    const docRef = await addDoc(collection(firestore, 'serverCommands'), {
      ...validatedData.data,
      createdAt: serverTimestamp(),
    });
    revalidatePath('/root/command');
    return { success: true, id: docRef.id };
  } catch (e: any) {
    await logErrorToFirestore({ message: `Failed to create server command: ${e.message}`, stack: e.stack, source: 'createServerCommand' });
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
    const { firestore } = initializeFirebase();
    const commandsRef = collection(firestore, 'serverCommands');
    
    const allDocsQuery = query(commandsRef, orderBy('name'));
    const allDocsSnapshot = await getDocs(allDocsQuery);
    
    let allCommands = allDocsSnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        const createdAt = data.createdAt;
        return {
            id: docSnap.id,
            name: data.name,
            description: data.description,
            commandTemplate: data.commandTemplate,
            parameters: data.parameters || [],
            preExecutionScript: data.preExecutionScript,
            type: data.type || 'view',
            danger: data.danger || 'low',
            allocatesPort: data.allocatesPort ?? false,
            portToReserve: data.portToReserve,
            createdAt: createdAt instanceof Timestamp ? createdAt.toDate().toISOString() : null,
        } as ServerCommand;
    });

    if (searchQuery) {
        allCommands = allCommands.filter(command =>
            command.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (command.description && command.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }

    const totalCount = allCommands.length;
    const paginatedCommands = allCommands.slice((page - 1) * pageSize, page * pageSize);

    return { success: true, commands: paginatedCommands, totalCount };
  } catch (e: any) {
    await logErrorToFirestore({ message: `Failed to get server commands: ${e.message}`, stack: e.stack, source: 'getServerCommands' });
    return { success: false, error: 'Failed to fetch commands.' };
  }
}

export async function getServerCommand(id: string): Promise<{ success: boolean; command?: ServerCommand; error?: string }> {
    try {
        const { firestore } = initializeFirebase();
        const docRef = doc(firestore, 'serverCommands', id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return { success: false, error: 'Command not found.' };
        }

        const data = docSnap.data();
        const createdAt = data.createdAt;

        const command: ServerCommand = {
            id: docSnap.id,
            name: data.name,
            description: data.description,
            commandTemplate: data.commandTemplate,
            parameters: data.parameters || [],
            preExecutionScript: data.preExecutionScript,
            type: data.type || 'view',
            danger: data.danger || 'low',
            allocatesPort: data.allocatesPort ?? false,
            portToReserve: data.portToReserve,
            createdAt: createdAt instanceof Timestamp ? createdAt.toDate().toISOString() : null,
        };
        return { success: true, command };

    } catch (e: any) {
        await logErrorToFirestore({ message: `Failed to get server command ${id}: ${e.message}`, stack: e.stack, source: 'getServerCommand' });
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

        const { firestore } = initializeFirebase();
        const docRef = doc(firestore, 'serverCommands', id);
        await setDoc(docRef, validatedData.data, { merge: true });
        revalidatePath('/root/command');
        revalidatePath(`/root/command/${id}`);
        return { success: true };
    } catch (e: any) {
        await logErrorToFirestore({ message: `Failed to update server command ${id}: ${e.message}`, stack: e.stack, source: 'updateServerCommand' });
        return { success: false, error: 'Failed to update command.' };
    }
}

export async function deleteServerCommand(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { firestore } = initializeFirebase();
        await deleteDoc(doc(firestore, 'serverCommands', id));
        revalidatePath('/root/command');
        return { success: true };
    } catch (e: any) {
        await logErrorToFirestore({ message: `Failed to delete server command ${id}: ${e.message}`, stack: e.stack, source: 'deleteServerCommand' });
        return { success: false, error: 'Failed to delete command.' };
    }
}



    
