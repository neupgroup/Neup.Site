

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
import { AlertCircle, ArrowLeft, Pencil, Trash2, Share2, Package, GitCommit, Disc, Terminal, Send, Eye, Globe, Zap, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getInstallNginxCommand } from '@/actions/server/management/install-nginx';
import { getFreePort80Command } from '@/actions/server/management/free-port-80';
import { getUpdateAndUpgradeCommand } from '@/actions/server/management/update-and-upgrade';
import { getCreateSwapCommand } from '@/actions/server/management/create-swap';
import { getConfigureNginxCommand } from '@/actions/server/management/configure-nginx';
import { getResetNginxCommand } from '@/actions/server/management/reset-nginx';
import { getInstallNpmCommand } from '@/actions/server/management/install-npm';
import { getBuildNpmWithMemoryCommand } from '@/actions/server/management/build-npm-with-memory';
import { getInstallPm2Command } from '@/actions/server/management/install-pm2';

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
  const [buildMemory, setBuildMemory] = useState('1024');
  const [deploymentPath, setDeploymentPath] = useState('/home/ubuntu/app');
  
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

const handleNginxConfig = async () => {
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

        const listenPort = 80;

        const command = await getConfigureNginxCommand({
            urls,
            proxyUrl,
            listenPort,
        });
        
        handleRunCommand(command, `Configure Nginx for ${urls[0]}`);

    } catch (e: any) {
        if (e instanceof TypeError && e.message.includes('Invalid URL')) {
            toast({ variant: 'destructive', title: 'Invalid URL', description: 'One of the provided URLs is not valid.'});
        } else {
             toast({ variant: 'destructive', title: 'Configuration Error', description: e.message || 'An unexpected error occurred.'});
        }
    }
};

const handleBuildNpm = async () => {
    try {
        const command = await getBuildNpmWithMemoryCommand({ memory: buildMemory, path: deploymentPath });
        handleRunCommand(command, `Build NPM Project`);
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Build Error', description: e.message });
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
                <Button onClick={async () => handleRunCommand(await getUpdateAndUpgradeCommand(), 'Update & Upgrade')} disabled={isPending}>
                    <GitCommit className="mr-2 h-4 w-4" /> Run Update
                </Button>
            </div>
             <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                    <h4 className="font-medium">Free Up Port 80</h4>
                    <p className="text-sm text-muted-foreground">Stop any process using port 80 (e.g., Apache).</p>
                </div>
                <Button variant="outline" onClick={async () => handleRunCommand(await getFreePort80Command(), 'Free Up Port 80')} disabled={isPending}>
                    <Zap className="mr-2 h-4 w-4" /> Stop Process
                </Button>
            </div>
             <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                <h4 className="font-medium">Install Nginx</h4>
                <p className="text-sm text-muted-foreground">Install and start the Nginx web server.</p>
                </div>
                <Button onClick={async () => handleRunCommand(await getInstallNginxCommand(), 'Install Nginx')} disabled={isPending}>
                    <Globe className="mr-2 h-4 w-4" /> Install Nginx
                </Button>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                <h4 className="font-medium">Install npm</h4>
                <p className="text-sm text-muted-foreground">Install Node.js and the Node Package Manager.</p>
                </div>
                <Button onClick={async () => handleRunCommand(await getInstallNpmCommand(), 'Install npm')} disabled={isPending}>
                    <Package className="mr-2 h-4 w-4" /> Install npm
                </Button>
            </div>
             <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                <h4 className="font-medium">Install PM2</h4>
                <p className="text-sm text-muted-foreground">Install PM2, a production process manager for Node.js.</p>
                </div>
                <Button onClick={async () => handleRunCommand(await getInstallPm2Command(), 'Install PM2')} disabled={isPending}>
                    <Package className="mr-2 h-4 w-4" /> Install PM2
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
                    <Button onClick={async () => handleRunCommand(await getCreateSwapCommand(swapSize), 'Create Swap')} className="ml-auto" disabled={isPending}>
                        <Disc className="mr-2 h-4 w-4" /> Create Swap
                    </Button>
                </div>
            </div>
            <div className="rounded-lg border p-4 space-y-4">
                <div>
                    <h4 className="font-medium">Build NPM with Memory Limit</h4>
                    <p className="text-sm text-muted-foreground">Run `npm install && npm run build` with a specific memory cap.</p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="deployment-path">Deployment Path</Label>
                    <Input id="deployment-path" value={deploymentPath} onChange={e => setDeploymentPath(e.target.value)} placeholder="/home/user/my-app" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="build-memory">Memory Limit (MB)</Label>
                    <Input id="build-memory" value={buildMemory} onChange={e => setBuildMemory(e.target.value)} placeholder="e.g., 1024" />
                </div>
                <Button onClick={handleBuildNpm} disabled={isPending}>
                    <Package className="mr-2 h-4 w-4" /> Run Build
                </Button>
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
             <div className="flex items-center justify-between rounded-lg border border-destructive/50 p-4">
                <div>
                    <h4 className="font-medium text-destructive">Reset Nginx Configurations</h4>
                    <p className="text-sm text-muted-foreground">Deletes all Nginx site configurations and symlinks.</p>
                </div>
                <Button variant="destructive" onClick={async () => handleRunCommand(await getResetNginxCommand(), 'Reset Nginx')} disabled={isPending}>
                    <ShieldAlert className="mr-2 h-4 w-4" /> Reset Nginx
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
