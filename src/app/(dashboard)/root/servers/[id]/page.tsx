
'use client';
import { useState, useEffect, use, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { getServer, type Server } from '@/actions/servers';
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertCircle, ArrowLeft, Pencil, Share2, Terminal, Send, Globe, Zap, ShieldAlert, ChevronLeft, ChevronRight, Loader2 as Loader2Icon, Cpu, Warehouse, User, Folder, PlayCircle, Eye, Lock, UploadCloud, FileText, X, Search, RefreshCw, HardDrive } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getConfigureNginxCommand } from '@/actions/server/management/configure-nginx';
import { getInstallCertbotNginxCommand } from '@/actions/server/management/install-certbot-nginx';
import { getStorageUsage } from '@/actions/server/management/get-storage-usage';
import { getServerLogs, type ServerLog } from '@/actions/server-logs';
import { getServerCommands, type ServerCommand } from '@/actions/commands';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { useDropzone } from 'react-dropzone';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

type UploadStatus = 'pending' | 'uploading' | 'success' | 'error';
interface UploadingFile {
  file: File;
  status: UploadStatus;
  progress: number;
  error?: string;
}

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


export default function ServerDetailPage({ params }: { params: { id: string } }) {
  const { id } = use(params);
  const [server, setServer] = useState<Server | null>(null);
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [isRefreshingStorage, setIsRefreshingStorage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customCommand, setCustomCommand] = useState('');
  const [nginxDomains, setNginxDomains] = useState('');
  const [proxyUrl, setProxyUrl] = useState('http://localhost:3000');
  const [certbotDomain, setCertbotDomain] = useState('');
  const [certbotEmail, setCertbotEmail] = useState('');
  
  const [isPending, startTransition] = useTransition();

  const { toast } = useToast();

  const [logs, setLogs] = useState<ServerLog[]>([]);
  const [logsPage, setLogsPage] = useState(1);
  const [hasMoreLogs, setHasMoreLogs] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [logsError, setLogsError] = useState<string | null>(null);
  
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  
  const [commandSearchQuery, setCommandSearchQuery] = useState('');
  const [searchedCommands, setSearchedCommands] = useState<ServerCommand[]>([]);
  const [loadingCommands, setLoadingCommands] = useState(false);
  const [commandToRun, setCommandToRun] = useState<ServerCommand | null>(null);
  const [commandParams, setCommandParams] = useState<Record<string, string>>({});
  const [allocatePort, setAllocatePort] = useState(false);
  const [portToAllocate, setPortToAllocate] = useState<number | ''>('');
  const [portDescription, setPortDescription] = useState('');

    const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadingFile[] = acceptedFiles.map(file => ({
      file,
      status: 'pending',
      progress: 0,
    }));
    setUploadingFiles(prev => [...prev, ...newFiles]);
  }, []);

  const handleFileUpload = async () => {
    const filesToUpload = uploadingFiles.filter(f => f.status === 'pending');
    if (filesToUpload.length === 0) return;

    for (const fileToUpload of filesToUpload) {
      setUploadingFiles(prev => prev.map(f => f === fileToUpload ? { ...f, status: 'uploading' } : f));
      
      const result = await uploadFile(fileToUpload.file, fileToUpload.file.webkitRelativePath, (progress) => {
         setUploadingFiles(prev => prev.map(f => f === fileToUpload ? { ...f, progress } : f));
      });
      
      setUploadingFiles(prev => prev.map(f => f === fileToUpload ? { ...f, status: result.success ? 'success' : 'error', error: result.error } : f));
    }
  };
  
    const uploadFile = async (file: File, path: string, onProgress: (progress: number) => void): Promise<{success: boolean, error?: string}> => {
        // This would be an API call to a serverless function or backend that handles the SSH connection and upload.
        // For now, we simulate the upload.
        console.log(`Simulating upload for ${file.name} to ${path}`);
        
        // Simulate progress
        for (let i = 0; i <= 100; i+= 10) {
            await new Promise(resolve => setTimeout(resolve, 50));
            onProgress(i);
        }
        
        // Simulate a potential failure
        if (file.name.includes('fail')) {
            return { success: false, error: 'Simulated upload failure.' };
        }
        
        return { success: true };
    }

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

  const fetchInitialData = useCallback(async () => {
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
  }, [id]);

  useEffect(() => {
    fetchInitialData();
  }, [id, fetchInitialData]);

   useEffect(() => {
    fetchLogs(logsPage);
  }, [id, logsPage]);

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

  useEffect(() => {
    if (commandSearchQuery.trim().length > 2) {
      const delayDebounceFn = setTimeout(async () => {
        setLoadingCommands(true);
        const result = await getServerCommands({ searchQuery: commandSearchQuery, pageSize: 5 });
        if (result.success && result.commands) {
          setSearchedCommands(result.commands);
        }
        setLoadingCommands(false);
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    } else {
      setSearchedCommands([]);
    }
  }, [commandSearchQuery]);
  
   const handleRefreshStorage = async () => {
    setIsRefreshingStorage(true);
    const result = await getStorageUsage(id);
    if (result.success && result.data) {
        setServer(prev => prev ? {
            ...prev,
            storageUsed: result.data!.used,
            storageTotal: result.data!.total,
            storageUnit: result.data!.unit,
        } : null);
        toast({ title: "Storage Refreshed" });
    } else {
        toast({ variant: 'destructive', title: "Failed to Refresh Storage", description: result.error });
    }
    setIsRefreshingStorage(false);
  };


  const handleRunCommand = (command: string, commandName?: string, portAllocation?: { port: number; description: string; }) => {
      if (!command) return;
      startTransition(async () => {
          await runCommand(id, command, {}, '', portAllocation);
          toast({ title: "Command Sent", description: `The command "${commandName || command}" has been sent to the server.`});
          setTimeout(() => fetchLogs(1), 1000);
      });
  };

  const handleRunSavedCommand = () => {
    if (!commandToRun) return;

    let portAllocation;
    if (allocatePort) {
        if (!portToAllocate || !portDescription) {
            toast({ variant: 'destructive', title: 'Missing Port Info', description: 'Port number and description are required for allocation.' });
            return;
        }
        portAllocation = { port: portToAllocate, description: portDescription };
    }

    startTransition(async () => {
        await runCommand(id, commandToRun.commandTemplate, commandParams, commandToRun.preExecutionScript, portAllocation, commandToRun.id);
        toast({ title: "Command Sent", description: `The command "${commandToRun.name}" has been sent to the server.`});
        setCommandToRun(null);
        setCommandParams({});
        setAllocatePort(false);
        setPortToAllocate('');
        setPortDescription('');
        setTimeout(() => fetchLogs(1), 1000); // refetch logs after a delay
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

const handleInstallCertbot = async () => {
    try {
        const command = await getInstallCertbotNginxCommand({ domain: certbotDomain, email: certbotEmail });
        handleRunCommand(command, `Install SSL for ${certbotDomain}`);
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'SSL Setup Error', description: e.message });
    }
};

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });
  
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
            <CardFooter className="flex justify-start gap-2">
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
                     <div className="flex items-center gap-2">
                        {server.isPrivate && <Badge variant="secondary">Private</Badge>}
                        {server.serverType && <Badge variant="outline" className="capitalize">{server.serverType}</Badge>}
                     </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                        <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2"><Globe className="h-4 w-4" />Public IP</h4>
                        <a href={`http://${server.publicIp}`} target="_blank" rel="noopener noreferrer" className="font-mono text-sm hover:underline">
                            {server.publicIp}
                        </a>
                    </div>
                     <div>
                        <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2"><Warehouse className="h-4 w-4" />Provider</h4>
                        <p className="text-sm">{server.provider || 'N/A'}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm text-muted-foreground">Created On</h4>
                        <p className="text-sm">{server.createdOn ? new Date(server.createdOn).toLocaleString() : 'N/A'}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2"><User className="h-4 w-4" />Default Username</h4>
                        <p className="font-mono text-sm">{server.username || 'N/A'}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2"><Folder className="h-4 w-4" />Default Base Path</h4>
                        <p className="font-mono text-sm">{server.basePath || 'N/A'}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2"><HardDrive className="h-4 w-4" />Storage</h4>
                        <div className="flex items-center gap-2">
                            <p className="font-mono text-sm">
                                {server.storageUsed && server.storageTotal
                                ? `${server.storageUsed}${server.storageUnit} / ${server.storageTotal}${server.storageUnit}`
                                : 'N/A'}
                            </p>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleRefreshStorage} disabled={isRefreshingStorage}>
                                {isRefreshingStorage ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                </div>
                
                 {server.portsOpen && server.portsOpen.length > 0 && (
                     <div>
                        <h4 className="font-semibold text-sm text-muted-foreground">Open Ports</h4>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {server.portsOpen.map(port => <Badge key={port} variant="secondary">{port}</Badge>)}
                        </div>
                    </div>
                 )}

                 {server.expiresOn && (
                     <div>
                        <h4 className="font-semibold text-sm text-muted-foreground">Expires On</h4>
                        <p className="text-sm">{new Date(server.expiresOn).toLocaleString()}</p>
                    </div>
                 )}
            </CardContent>
            <CardFooter className="flex justify-start gap-2">
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
                 <AccordionItem value="run-saved-command" className="border-0">
                    <AccordionTrigger className="flex w-full items-center justify-between rounded-lg border p-4 hover:bg-muted/50 data-[state=open]:rounded-b-none data-[state=open]:border-b-0 hover:no-underline cursor-pointer">
                        <div>
                            <h4 className="font-medium text-left">Run Saved Command</h4>
                            <p className="text-sm text-muted-foreground text-left">Execute a pre-defined command template on this server.</p>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="border rounded-b-lg p-4 space-y-4">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search for a command..."
                                className="pl-8"
                                value={commandSearchQuery}
                                onChange={(e) => setCommandSearchQuery(e.target.value)}
                            />
                        </div>
                        {loadingCommands ? (
                            <div className="text-center p-4"><Loader2Icon className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
                        ) : searchedCommands.length > 0 ? (
                            <div className="space-y-2">
                                {searchedCommands.map(cmd => (
                                    <div key={cmd.id} className="flex items-center justify-between p-2 border rounded-md">
                                        <div className="flex-1">
                                            <p className="font-medium">{cmd.name}</p>
                                            <p className="text-xs text-muted-foreground">{cmd.description}</p>
                                        </div>
                                        <Button size="sm" onClick={() => setCommandToRun(cmd)}>Run</Button>
                                    </div>
                                ))}
                            </div>
                        ) : commandSearchQuery.length > 2 ? (
                            <p className="text-sm text-muted-foreground text-center p-4">No commands found.</p>
                        ) : null}
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

                <AccordionItem value="install-certbot" className="border-0">
                    <AccordionTrigger className="flex w-full items-center justify-between rounded-lg border p-4 hover:bg-muted/50 data-[state=open]:rounded-b-none data-[state=open]:border-b-0 hover:no-underline cursor-pointer">
                        <div>
                            <h4 className="font-medium text-left">Setup SSL with Certbot</h4>
                            <p className="text-sm text-muted-foreground text-left">Install Certbot and get a free SSL certificate from Let's Encrypt.</p>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="border rounded-b-lg p-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="certbot-domain">Domain</Label>
                            <Input id="certbot-domain" value={certbotDomain} onChange={e => setCertbotDomain(e.target.value)} placeholder="e.g., yourdomain.com" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="certbot-email">Email</Label>
                            <Input id="certbot-email" type="email" value={certbotEmail} onChange={e => setCertbotEmail(e.target.value)} placeholder="e.g., admin@yourdomain.com" />
                        </div>
                        <Button onClick={handleInstallCertbot} disabled={isPending}>
                            <Lock className="mr-2 h-4 w-4" /> Setup SSL
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
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setLogsPage(prev => Math.max(1, prev - 1))}
                            disabled={logsPage <= 1 || loadingLogs}
                        >
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setLogsPage(prev => prev + 1)}
                            disabled={!hasMoreLogs || loadingLogs}
                        >
                            Next
                            <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Page {logsPage}
                    </div>
                </CardFooter>
            )}
        </Card>
        
        {commandToRun && (
            <Dialog open={!!commandToRun} onOpenChange={() => { setCommandToRun(null); setCommandParams({}); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Run: {commandToRun.name}</DialogTitle>
                        <DialogDescription>{commandToRun.description}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {(commandToRun.parameters || []).map(param => (
                            <div key={param.key} className="space-y-2">
                                <Label htmlFor={param.key}>{param.label}</Label>
                                <Input
                                    id={param.key}
                                    value={commandParams[param.key] || ''}
                                    onChange={e => setCommandParams(prev => ({...prev, [param.key]: e.target.value}))}
                                    type={param.type === 'number' ? 'number' : 'text'}
                                />
                            </div>
                        ))}
                        {(!commandToRun.parameters || commandToRun.parameters.length === 0) && (
                            <p className="text-sm text-muted-foreground">This command has no parameters.</p>
                        )}
                        <div className="space-y-3 pt-4 border-t">
                            <div className="flex items-center space-x-2">
                                <Switch id="allocate-port" checked={allocatePort} onCheckedChange={setAllocatePort} />
                                <Label htmlFor="allocate-port">Allocate a port for this command</Label>
                            </div>
                            {allocatePort && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="port-to-allocate">Port</Label>
                                        <Input
                                            id="port-to-allocate"
                                            type="number"
                                            value={portToAllocate}
                                            onChange={(e) => setPortToAllocate(e.target.value ? parseInt(e.target.value, 10) : '')}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="port-description">Description</Label>
                                        <Input
                                            id="port-description"
                                            value={portDescription}
                                            onChange={(e) => setPortDescription(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setCommandToRun(null)}>Cancel</Button>
                        <Button onClick={handleRunSavedCommand} disabled={isPending}>
                            {isPending && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
                            Run Command
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )}
    </div>
  );
}
