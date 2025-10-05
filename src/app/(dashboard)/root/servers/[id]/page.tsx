

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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertCircle, ArrowLeft, Pencil, Trash2, Share2, Package, GitCommit, Disc, Terminal, Send, Eye, Globe, Zap, ShieldAlert, ChevronLeft, ChevronRight, CheckCircle, XCircle, Loader2 as Loader2Icon } from 'lucide-react';
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
import { getStartNextWithPm2Command } from '@/actions/server/management/start-next-with-pm2';
import { getRebootServerCommand } from '@/actions/server/management/reboot-server';
import { getServerLogs, type ServerLog } from '@/actions/server-logs';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

const FullLog = ({ log }: { log: ServerLog }) => {
    return (
        <div className="space-y-2">
            <h4 className="font-semibold text-sm">Full Command:</h4>
            <pre className="text-xs bg-black text-white p-3 rounded-md overflow-x-auto whitespace-pre-wrap font-mono">
                {log.command}
            </pre>
            <h4 className="font-semibold text-sm mt-4">Output:</h4>
            <pre className="text-xs bg-black text-white p-3 mt-2 rounded-md overflow-x-auto whitespace-pre-wrap font-mono">
                {log.output || 'No output from this command.'}
            </pre>
             {log.completedAt && (
                <p className="text-xs text-muted-foreground mt-2 text-right">Completed: {new Date(log.completedAt).toLocaleString()}</p>
            )}
        </div>
    );
};


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
  const [pm2AppName, setPm2AppName] = useState('next-app');
  const [pm2AppPort, setPm2AppPort] = useState(3000);
  
  const [isPending, startTransition] = useTransition();

  const { toast } = useToast();

  const [logs, setLogs] = useState<ServerLog[]>([]);
  const [logsPage, setLogsPage] = useState(1);
  const [hasMoreLogs, setHasMoreLogs] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [logsError, setLogsError] = useState<string | null>(null);

  const fetchLogs = async (page = 1) => {
    setLoadingLogs(true);
    setLogsError(null);
    const result = await getServerLogs({ serverId: id, page, pageSize: 5 });

    if (result.success && result.logs) {
        setLogs(result.logs!);
        setHasMoreLogs(result.hasMore || false);
    } else {
        const errorMessage = result.error || 'Failed to load logs.';
        setLogsError(errorMessage);
        logErrorToFirestore({
            message: `Client-side error in fetchLogs for serverId: ${id}. Error: ${errorMessage}`,
            stack: new Error().stack,
            source: 'ServerDetailPage.fetchLogs',
        });
    }
    setLoadingLogs(false);
  }

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
    fetchLogs(1); // Initial log fetch
  }, [id]);

  useEffect(() => {
    const hasOngoingLog = logs.some(log => log.status === 'ongoing' || log.status === 'pending');
    let interval: NodeJS.Timeout | null = null;
    if (hasOngoingLog) {
      interval = setInterval(() => {
        fetchLogs(logsPage);
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [logs, id, logsPage]);

  const handleRunCommand = (command: string, commandName?: string) => {
      if (!command) return;
      startTransition(async () => {
          await runCommand(id, command);
          toast({ title: "Command Sent", description: `The command "${commandName || command}" has been sent to the server.`});
          // Refresh logs after a short delay to allow log creation
          setTimeout(() => fetchLogs(1), 1000);
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

const handleStartNextWithPm2 = async () => {
    try {
        const command = await getStartNextWithPm2Command({ appName: pm2AppName, path: deploymentPath, port: pm2AppPort });
        handleRunCommand(command, `Start Next.js app with PM2`);
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'PM2 Start Error', description: e.message });
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
          <CardContent>
             <Accordion type="single" collapsible className="w-full space-y-2">
                <AccordionItem value="update-upgrade" className="border-0">
                    <AccordionTrigger className="flex w-full items-center justify-between rounded-lg border p-4 hover:bg-muted/50 data-[state=open]:rounded-b-none data-[state=open]:border-b-0 hover:no-underline cursor-pointer">
                        <div>
                            <h4 className="font-medium text-left">Update & Upgrade Server</h4>
                            <p className="text-sm text-muted-foreground text-left">Run apt-get update && apt-get upgrade.</p>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="border rounded-b-lg p-4">
                        <Button onClick={async () => handleRunCommand(await getUpdateAndUpgradeCommand(), 'Update & Upgrade')} disabled={isPending}>
                            <GitCommit className="mr-2 h-4 w-4" /> Run Update
                        </Button>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="free-port" className="border-0">
                    <AccordionTrigger className="flex w-full items-center justify-between rounded-lg border p-4 hover:bg-muted/50 data-[state=open]:rounded-b-none data-[state=open]:border-b-0 hover:no-underline cursor-pointer">
                        <div>
                            <h4 className="font-medium text-left">Free Up Port 80</h4>
                            <p className="text-sm text-muted-foreground text-left">Stop any process using port 80 (e.g., Apache).</p>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="border rounded-b-lg p-4">
                        <Button variant="outline" onClick={async () => handleRunCommand(await getFreePort80Command(), 'Free Up Port 80')} disabled={isPending}>
                            <Zap className="mr-2 h-4 w-4" /> Stop Process
                        </Button>
                    </AccordionContent>
                </AccordionItem>

                 <AccordionItem value="install-nginx" className="border-0">
                    <AccordionTrigger className="flex w-full items-center justify-between rounded-lg border p-4 hover:bg-muted/50 data-[state=open]:rounded-b-none data-[state=open]:border-b-0 hover:no-underline cursor-pointer">
                        <div>
                            <h4 className="font-medium text-left">Install Nginx</h4>
                            <p className="text-sm text-muted-foreground text-left">Install and start the Nginx web server.</p>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="border rounded-b-lg p-4">
                        <Button onClick={async () => handleRunCommand(await getInstallNginxCommand(), 'Install Nginx')} disabled={isPending}>
                            <Globe className="mr-2 h-4 w-4" /> Install Nginx
                        </Button>
                    </AccordionContent>
                </AccordionItem>
                
                 <AccordionItem value="install-npm" className="border-0">
                    <AccordionTrigger className="flex w-full items-center justify-between rounded-lg border p-4 hover:bg-muted/50 data-[state=open]:rounded-b-none data-[state=open]:border-b-0 hover:no-underline cursor-pointer">
                        <div>
                            <h4 className="font-medium text-left">Install npm</h4>
                            <p className="text-sm text-muted-foreground text-left">Install Node.js and the Node Package Manager.</p>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="border rounded-b-lg p-4">
                         <Button onClick={async () => handleRunCommand(await getInstallNpmCommand(), 'Install npm')} disabled={isPending}>
                            <Package className="mr-2 h-4 w-4" /> Install npm
                        </Button>
                    </AccordionContent>
                </AccordionItem>
                
                 <AccordionItem value="install-pm2" className="border-0">
                    <AccordionTrigger className="flex w-full items-center justify-between rounded-lg border p-4 hover:bg-muted/50 data-[state=open]:rounded-b-none data-[state=open]:border-b-0 hover:no-underline cursor-pointer">
                        <div>
                            <h4 className="font-medium text-left">Install PM2</h4>
                            <p className="text-sm text-muted-foreground text-left">Install PM2, a production process manager for Node.js.</p>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="border rounded-b-lg p-4">
                        <Button onClick={async () => handleRunCommand(await getInstallPm2Command(), 'Install PM2')} disabled={isPending}>
                            <Package className="mr-2 h-4 w-4" /> Install PM2
                        </Button>
                    </AccordionContent>
                </AccordionItem>

                 <AccordionItem value="create-swap" className="border-0">
                    <AccordionTrigger className="flex w-full items-center justify-between rounded-lg border p-4 hover:bg-muted/50 data-[state=open]:rounded-b-none data-[state=open]:border-b-0 hover:no-underline cursor-pointer">
                        <div>
                            <h4 className="font-medium text-left">Create Swap Space</h4>
                            <p className="text-sm text-muted-foreground text-left">Create a swap file to use as virtual RAM.</p>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="border rounded-b-lg p-4 space-y-3">
                         <div className="flex items-center gap-2">
                            <Input 
                                id="swap-size"
                                value={swapSize}
                                onChange={(e) => setSwapSize(e.target.value)}
                                className="max-w-[120px]"
                            />
                            <Label htmlFor="swap-size" className="text-sm text-muted-foreground">MB</Label>
                        </div>
                        <Button onClick={async () => handleRunCommand(await getCreateSwapCommand(swapSize), 'Create Swap')} disabled={isPending}>
                            <Disc className="mr-2 h-4 w-4" /> Create Swap
                        </Button>
                    </AccordionContent>
                </AccordionItem>
                
                 <AccordionItem value="build-npm" className="border-0">
                    <AccordionTrigger className="flex w-full items-center justify-between rounded-lg border p-4 hover:bg-muted/50 data-[state=open]:rounded-b-none data-[state=open]:border-b-0 hover:no-underline cursor-pointer">
                        <div>
                            <h4 className="font-medium text-left">Build NPM with Memory Limit</h4>
                            <p className="text-sm text-muted-foreground text-left">Run `npm install && npm run build` with a specific memory cap.</p>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="border rounded-b-lg p-4 space-y-4">
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
                    </AccordionContent>
                </AccordionItem>
                
                 <AccordionItem value="start-pm2" className="border-0">
                    <AccordionTrigger className="flex w-full items-center justify-between rounded-lg border p-4 hover:bg-muted/50 data-[state=open]:rounded-b-none data-[state=open]:border-b-0 hover:no-underline cursor-pointer">
                        <div>
                            <h4 className="font-medium text-left">Start Next.js App with PM2</h4>
                            <p className="text-sm text-muted-foreground text-left">Start the Next.js app in the deployment path using PM2.</p>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="border rounded-b-lg p-4 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="pm2-app-name">PM2 App Name</Label>
                                <Input id="pm2-app-name" value={pm2AppName} onChange={e => setPm2AppName(e.target.value)} placeholder="my-next-app" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pm2-app-port">Port</Label>
                                <Input id="pm2-app-port" type="number" value={pm2AppPort} onChange={e => setPm2AppPort(Number(e.target.value))} placeholder="3000" />
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="pm2-deployment-path">Deployment Path</Label>
                            <Input id="pm2-deployment-path" value={deploymentPath} onChange={e => setDeploymentPath(e.target.value)} placeholder="/home/user/my-app" />
                        </div>
                        <Button onClick={handleStartNextWithPm2} disabled={isPending}>
                            <Package className="mr-2 h-4 w-4" /> Start with PM2
                        </Button>
                    </AccordionContent>
                </AccordionItem>

                 <AccordionItem value="config-nginx" className="border-0">
                    <AccordionTrigger className="flex w-full items-center justify-between rounded-lg border p-4 hover:bg-muted/50 data-[state=open]:rounded-b-none data-[state=open]:border-b-0 hover:no-underline cursor-pointer">
                        <div>
                            <h4 className="font-medium text-left">Configure Nginx Reverse Proxy</h4>
                            <p className="text-sm text-muted-foreground text-left">Point one or more domains/paths to an application running on this server.</p>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="border rounded-b-lg p-4 space-y-4">
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
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="custom-command" className="border-0">
                    <AccordionTrigger className="flex w-full items-center justify-between rounded-lg border p-4 hover:bg-muted/50 data-[state=open]:rounded-b-none data-[state=open]:border-b-0 hover:no-underline cursor-pointer">
                        <div>
                            <h4 className="font-medium text-left">Run Custom Command</h4>
                            <p className="text-sm text-muted-foreground text-left">Execute any shell command on the server.</p>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="border rounded-b-lg p-4">
                        <div className="grid w-full gap-2">
                            <Textarea 
                                value={customCommand}
                                onChange={(e) => setCustomCommand(e.target.value)}
                                placeholder="e.g., ls -la" 
                                rows={4}
                                className="font-mono"
                            />
                            <div className="flex justify-start">
                                <Button size="sm" onClick={() => handleRunCommand(customCommand)} disabled={isPending || !customCommand}>
                                    <Send className="mr-2 h-4 w-4" /> Run Command
                                </Button>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
                
                 <AccordionItem value="reboot-server" className="border-0">
                    <AccordionTrigger className="flex w-full items-center justify-between rounded-lg border border-destructive/50 p-4 hover:bg-destructive/10 data-[state=open]:rounded-b-none data-[state=open]:border-b-0 hover:no-underline cursor-pointer">
                        <div className="text-destructive">
                            <h4 className="font-medium text-left">Reboot Server</h4>
                            <p className="text-sm text-destructive/80 text-left">Gracefully restarts the server.</p>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="border border-t-0 rounded-b-lg p-4">
                        <Button variant="destructive" onClick={async () => handleRunCommand(await getRebootServerCommand(), 'Reboot Server')} disabled={isPending}>
                            <ShieldAlert className="mr-2 h-4 w-4" /> Reboot Server
                        </Button>
                    </AccordionContent>
                </AccordionItem>
                
                 <AccordionItem value="reset-nginx" className="border-0">
                    <AccordionTrigger className="flex w-full items-center justify-between rounded-lg border border-destructive/50 p-4 hover:bg-destructive/10 data-[state=open]:rounded-b-none data-[state=open]:border-b-0 hover:no-underline cursor-pointer">
                        <div className="text-destructive">
                            <h4 className="font-medium text-left">Reset Nginx Configurations</h4>
                            <p className="text-sm text-destructive/80 text-left">Deletes all Nginx site configurations and symlinks.</p>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="border border-t-0 rounded-b-lg p-4">
                        <Button variant="destructive" onClick={async () => handleRunCommand(await getResetNginxCommand(), 'Reset Nginx')} disabled={isPending}>
                            <ShieldAlert className="mr-2 h-4 w-4" /> Reset Nginx
                        </Button>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Server Logs</CardTitle>
                <CardDescription>History of all commands run on this server.</CardDescription>
            </CardHeader>
            <CardContent>
                 {loadingLogs && logs.length === 0 ? (
                    <div className="space-y-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                ) : logsError ? (
                        <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error Loading Logs</AlertTitle>
                        <AlertDescription className="break-all">{logsError}</AlertDescription>
                    </Alert>
                ) : logs.length === 0 ? (
                    <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
                        <Terminal className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold">No Logs Found</h3>
                        <p>Run a command from the Server Management section to see logs here.</p>
                    </div>
                ) : (
                    <Accordion type="single" collapsible className="w-full space-y-2">
                        {logs.map(log => (
                            <AccordionItem value={log.id} key={log.id} className="border rounded-md px-4 cursor-pointer hover:bg-muted/50">
                                <AccordionTrigger className="hover:no-underline">
                                    <div className="flex flex-col items-start text-left w-full gap-2">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Badge variant={log.status === 'completed' ? 'default' : log.status === 'failed' ? 'destructive' : 'secondary'}>
                                                {log.status === 'ongoing' && <Loader2Icon className="mr-1 h-3 w-3 animate-spin" />}
                                                {log.status}
                                            </Badge>
                                            <span>{log.initiatedAt ? formatDistanceToNow(new Date(log.initiatedAt), { addSuffix: true }) : 'Just now'}</span>
                                            <span>by {log.initiatedBy}</span>
                                        </div>
                                        <p className="font-mono text-sm break-all whitespace-pre-wrap">
                                            {log.command.length > 150 ? `${log.command.substring(0, 150)}...` : log.command}
                                        </p>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <FullLog log={log} />
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                )}
            </CardContent>
             {(logsPage > 1 || hasMoreLogs) && (
                <CardFooter className="flex items-center justify-between pt-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLogsPage(prev => Math.max(1, prev - 1))}
                        disabled={logsPage <= 1 || loadingLogs}
                    >
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">Page {logsPage}</span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLogsPage(prev => prev + 1)}
                        disabled={!hasMoreLogs || loadingLogs}
                    >
                        Next
                        <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                </CardFooter>
            )}
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

