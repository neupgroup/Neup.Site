

'use client';
import { useState, useEffect, useTransition, use } from 'react';
import { useRouter } from 'next/navigation';
import { getServer, deleteServer, type Server } from '@/actions/servers';
import { runCommand } from '@/actions/runner';
import { logErrorToFirestore } from '@/lib/logging';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertCircle, ArrowLeft, Pencil, Trash2, Share2, Package, GitCommit, Disc, Terminal, Send, Eye, Globe, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function ServerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [server, setServer] = useState<Server | null>(null);
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [swapSize, setSwapSize] = useState('3072');
  const [customCommand, setCustomCommand] = useState('');
  const [nginxDomains, setNginxDomains] = useState('');
  const [proxyUrl, setProxyUrl] = useState('http://localhost:3000');
  
  const [isPending, startTransition] = useTransition();

  const { toast } = useToast();

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      const result = await getServer(id);
      if (result.success && result.server) {
        setServer(result.server);
      } else {
        const errorMessage = result.error || 'Failed to fetch server.';
        setError(errorMessage);
         logErrorToFirestore({
            message: `Client-side error fetching server details for serverId: ${id}. Error: ${errorMessage}`,
            stack: new Error().stack,
            source: 'ServerDetailPage.fetchInitialData',
        });
      }
      setLoading(false);
    };

    fetchInitialData();
  }, [id]);

  const handleRunCommand = (command: string, commandName?: string) => {
      if (!command) return;
      startTransition(async () => {
          await runCommand(id, command);
          toast({ title: "Command Sent", description: `The command "${commandName || command}" has been sent to the server.`});
      });
  };

  const handleNginxConfig = () => {
    const urls = nginxDomains.split('\n').map(u => u.trim()).filter(Boolean);
    if (urls.length === 0) {
        toast({ variant: 'destructive', title: 'Error', description: 'At least one domain or path is required.' });
        return;
    }

    try {
        const proxyPort = new URL(proxyUrl).port;
        if (['80', '443', '22'].includes(proxyPort)) {
            toast({ variant: 'destructive', title: 'Invalid Port', description: `Cannot proxy to reserved port ${proxyPort}.`});
            return;
        }

        const firstUrl = new URL(urls[0].startsWith('http') ? urls[0] : `http://${urls[0]}`);
        const primaryDomain = firstUrl.hostname;
        const primaryPath = firstUrl.pathname.replace(/\//g, '_').replace(/^_/, '');
        
        let safeDomain = primaryDomain.replace(/[^a-zA-Z0-9.-]/g, '_');
        if (primaryPath) {
            safeDomain = `${safeDomain}_${primaryPath}`;
        }


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
    listen 80;
    server_name ${serverName};
    ${locationBlocks}
}`;

        const escapedConfig = config.replace(/"/g, '\\"').replace(/\$/g, '\\$');

        const command = `
sudo mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled &&
if [ -f /etc/nginx/sites-available/${safeDomain} ]; then
    sudo rm -f /etc/nginx/sites-enabled/${safeDomain};
    sudo rm -f /etc/nginx/sites-available/${safeDomain};
fi &&
sudo bash -c "echo \\"${escapedConfig}\\" > /etc/nginx/sites-available/${safeDomain}" &&
sudo ln -s -f /etc/nginx/sites-available/${safeDomain} /etc/nginx/sites-enabled/ &&
sudo systemctl restart nginx
`.trim();
        
        handleRunCommand(command, `Configure Nginx for ${primaryDomain}`);

    } catch (e: any) {
        if (e instanceof TypeError && e.message.includes('Invalid URL')) {
            toast({ variant: 'destructive', title: 'Invalid URL', description: 'One of the provided URLs is not valid.'});
        } else {
             toast({ variant: 'destructive', title: 'Configuration Error', description: e.message || 'An unexpected error occurred.'});
        }
    }
};


  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    const result = await deleteServer(id);
    if(result.success) {
        toast({ title: 'Server Deleted', description: 'The server has been removed.'});
        router.push('/root/servers');
    } else {
        const errorMessage = result.error || 'Failed to delete server.';
        toast({ variant: 'destructive', title: 'Error', description: errorMessage });
        logErrorToFirestore({
            message: `Client-side error deleting server for serverId: ${id}. Error: ${errorMessage}`,
            stack: new Error().stack,
            source: 'ServerDetailPage.handleDelete',
        });
    }
  }
  
  if (loading) {
    return (
        <Card className="w-full">
            <CardHeader>
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-20 w-full" />
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
            </CardFooter>
        </Card>
    );
  }

  if (error || !server) {
    return (
      <div className="w-full">
         <div className="mb-4">
            <Button asChild variant="outline">
              <Link href="/root/servers">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Servers
              </Link>
            </Button>
        </div>
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error || 'Server not found.'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
        <div className="mb-4">
            <Button variant="ghost" asChild>
                <Link href="/root/servers">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Servers
                </Link>
            </Button>
        </div>
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>{server.name}</CardTitle>
                        <CardDescription>ID: {server.id}</CardDescription>
                    </div>
                    <Button asChild variant="outline" size="sm">
                        <Link href={`/root/servers/${server.id}/logs`}>
                            <Eye className="mr-2 h-4 w-4" /> View Logs
                        </Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Public IP</h4>
                    <a href={`http://${server.publicIp}`} target="_blank" rel="noopener noreferrer" className="font-mono text-sm hover:underline">
                        {server.publicIp}
                    </a>
                </div>
                 <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Created On</h4>
                    <p className="text-sm">{server.createdOn ? new Date(server.createdOn).toLocaleString() : 'N/A'}</p>
                </div>
                 {server.expiresOn && (
                     <div>
                        <h4 className="font-semibold text-sm text-muted-foreground">Expires On</h4>
                        <p className="text-sm">{new Date(server.expiresOn).toLocaleString()}</p>
                    </div>
                 )}
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                    <Trash2 className="mr-2 h-4 w-4"/> Delete
                </Button>
                 <Button asChild variant="outline">
                    <Link href={`/root/servers/allocations/create?serverId=${id}`}>
                        <Share2 className="mr-2 h-4 w-4"/> Allocate Server
                    </Link>
                </Button>
                <Button asChild>
                    <Link href={`/root/servers/${id}/edit`}>
                        <Pencil className="mr-2 h-4 w-4"/> Edit
                    </Link>
                </Button>
            </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Server Management</CardTitle>
            <CardDescription>Perform common server maintenance and setup tasks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                    <h4 className="font-medium">Update &amp; Upgrade Server</h4>
                    <p className="text-sm text-muted-foreground">Run apt-get update &amp;&amp; apt-get upgrade.</p>
                </div>
                <Button onClick={() => handleRunCommand('sudo apt-get update && sudo apt-get upgrade -y', 'Update & Upgrade')} disabled={isPending}>
                    <GitCommit className="mr-2 h-4 w-4" /> Run Update
                </Button>
            </div>
             <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                    <h4 className="font-medium">Free Up Port 80</h4>
                    <p className="text-sm text-muted-foreground">Stop any process using port 80 (e.g., Apache).</p>
                </div>
                <Button variant="outline" onClick={() => handleRunCommand('sudo lsof -t -i:80 | xargs -r sudo kill -9', 'Free Up Port 80')} disabled={isPending}>
                    <Zap className="mr-2 h-4 w-4" /> Stop Process
                </Button>
            </div>
             <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                <h4 className="font-medium">Install Nginx</h4>
                <p className="text-sm text-muted-foreground">Install and start the Nginx web server.</p>
                </div>
                <Button onClick={() => handleRunCommand('sudo apt-get install -y nginx && sudo systemctl start nginx && sudo systemctl enable nginx', 'Install Nginx')} disabled={isPending}>
                    <Globe className="mr-2 h-4 w-4" /> Install Nginx
                </Button>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                <h4 className="font-medium">Install npm</h4>
                <p className="text-sm text-muted-foreground">Install Node.js and the Node Package Manager.</p>
                </div>
                <Button onClick={() => handleRunCommand('sudo apt-get install -y nodejs npm', 'Install npm')} disabled={isPending}>
                    <Package className="mr-2 h-4 w-4" /> Install npm
                </Button>
            </div>
            <div className="rounded-lg border p-4">
                <h4 className="font-medium">Create Swap Space</h4>
                <p className="text-sm text-muted-foreground">Create a swap file to use as virtual RAM.</p>
                <div className="flex items-center gap-2 mt-3">
                    <Input 
                        id="swap-size"
                        value={swapSize}
                        onChange={(e) => setSwapSize(e.target.value)}
                        className="max-w-[120px]"
                    />
                        <Label htmlFor="swap-size" className="text-sm text-muted-foreground">MB</Label>
                    <Button onClick={() => handleRunCommand(`sudo fallocate -l ${swapSize}M /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile`, 'Create Swap')} className="ml-auto" disabled={isPending}>
                        <Disc className="mr-2 h-4 w-4" /> Create Swap
                    </Button>
                </div>
            </div>
            <div className="rounded-lg border p-4 space-y-4">
                <div>
                    <h4 className="font-medium">Configure Nginx Reverse Proxy</h4>
                    <p className="text-sm text-muted-foreground">Point one or more domains/paths to an application running on this server.</p>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="nginx-domains">Domains / Paths</Label>
                    <Textarea 
                        id="nginx-domains"
                        value={nginxDomains} 
                        onChange={e => setNginxDomains(e.target.value)} 
                        placeholder="example.com
www.example.com/subpath"
                        rows={3}
                    />
                    <p className="text-xs text-muted-foreground">Enter one URL per line.</p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="proxy-url">Proxy Pass URL</Label>
                    <Input id="proxy-url" value={proxyUrl} onChange={e => setProxyUrl(e.target.value)} />
                    <p className="text-xs text-muted-foreground">The internal URL of your application (e.g., http://localhost:3000).</p>
                </div>
                 <Button onClick={handleNginxConfig} disabled={isPending}>
                    <Globe className="mr-2 h-4 w-4" /> Configure Nginx
                </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Run Custom Command</CardTitle>
                <CardDescription>Execute any shell command on the server.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid w-full gap-2">
                    <Textarea 
                        value={customCommand}
                        onChange={(e) => setCustomCommand(e.target.value)}
                        placeholder="e.g., ls -la" 
                        rows={4}
                        className="font-mono"
                    />
                    <Button onClick={() => handleRunCommand(customCommand)} disabled={isPending || !customCommand}>
                        <Send className="mr-2 h-4 w-4" /> Run Command
                    </Button>
                </div>
            </CardContent>
        </Card>
        
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the server "{server.name}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}

