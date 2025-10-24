
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
import { AlertCircle, ArrowLeft, Pencil, Share2, Terminal, Send, Globe, Zap, ShieldAlert, ChevronLeft, ChevronRight, Loader2 as Loader2Icon, Cpu, Warehouse, User, Folder, PlayCircle, Eye, Lock, UploadCloud, FileText, X, Search, RefreshCw, HardDrive, Wifi } from 'lucide-react';
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
import { getActivePorts, ActivePortInfo } from '@/actions/server/management/get-active-ports';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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


const ActivePortsSection = ({ serverId }: { serverId: string }) => {
  const [ports, setPorts] = useState<ActivePortInfo[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPorts = async () => {
    setIsLoading(true);
    setError(null);
    const result = await getActivePorts(serverId);
    if (result.success) {
      setPorts(result.ports || []);
    } else {
      setError(result.error || 'Failed to fetch active ports.');
    }
    setIsLoading(false);
  };

  return (
    <AccordionItem value="active-ports">
      <AccordionTrigger className="text-lg font-medium" onClick={() => !ports && fetchPorts()}>
        <div className="flex items-center gap-2">
          <Wifi className="h-5 w-5" /> Network Status
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-2">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : ports && ports.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Port</TableHead>
                <TableHead>Protocol</TableHead>
                <TableHead>Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ports.map((portInfo, index) => (
                <TableRow key={`${portInfo.port}-${portInfo.protocol}-${index}`}>
                  <TableCell className="font-medium">{portInfo.port}</TableCell>
                  <TableCell>{portInfo.protocol}</TableCell>
                  <TableCell className="font-mono text-xs">{portInfo.address}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center text-muted-foreground p-8">
            <p>No active listening ports found.</p>
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
};


export default function ServerDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [server, setServer] = useState<Server | null>(null);
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [isRefreshingStorage, setIsRefreshingStorage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customCommand, setCustomCommand] = useState('');
  
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
  const [isCustomCommand, setIsCustomCommand] = useState(false);

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


  const handleRunCommand = (command: string, commandName?: string) => {
      if (!command) return;
      startTransition(async () => {
          await runCommand(id, command, {});
          toast({ title: "Command Sent", description: `The command "${commandName || command}" has been sent to the server.`});
          setCustomCommand('');
          setTimeout(() => fetchLogs(1), 1000);
      });
  };

  const handleRunSavedCommand = () => {
    if (!commandToRun) return;
    
    startTransition(async () => {
        await runCommand(id, commandToRun.id, commandParams);
        toast({ title: "Command Sent", description: `The command "${commandToRun.name}" has been sent to the server.`});
        setCommandToRun(null);
        setCommandParams({});
        setTimeout(() => fetchLogs(1), 1000); // refetch logs after a delay
    });
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
                
                 {server.usedPorts && server.usedPorts.length > 0 && (
                     <div>
                        <h4 className="font-semibold text-sm text-muted-foreground">Used Ports (from DB)</h4>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {server.usedPorts.map(p => <Badge key={p.port} variant="secondary">{p.port}: {p.description}</Badge>)}
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
            </CardFooter>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Live Server Status</CardTitle>
                <CardDescription>Real-time information fetched directly from the server.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Accordion type="single" collapsible className="w-full space-y-2">
                    <ActivePortsSection serverId={id} />
                </Accordion>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Server Management</CardTitle>
                <CardDescription>Perform common server maintenance and setup tasks.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="command-search">Run Saved Command</Label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="command-search"
                                placeholder="Search for a command..."
                                className="pl-8"
                                value={commandSearchQuery}
                                onChange={(e) => setCommandSearchQuery(e.target.value)}
                            />
                        </div>
                        {loadingCommands ? (
                            <div className="text-center p-4"><Loader2Icon className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
                        ) : searchedCommands.length > 0 ? (
                            <div className="space-y-2 mt-2">
                                {searchedCommands.map(cmd => (
                                    <div key={cmd.id} className="flex items-center justify-between p-2 border rounded-md">
                                        <div className="flex-1">
                                            <p className="font-medium">{cmd.name}</p>
                                            <p className="text-xs text-muted-foreground">{cmd.description}</p>
                                        </div>
                                        <Button size="sm" onClick={() => { setCommandToRun(cmd); setIsCustomCommand(false); }}>Run</Button>
                                    </div>
                                ))}
                            </div>
                        ) : commandSearchQuery.length > 2 ? (
                            <p className="text-sm text-muted-foreground text-center p-4">No commands found.</p>
                        ) : null}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="custom-command">Run Custom Command</Label>
                        <div className="grid w-full gap-2">
                            <Textarea 
                                id="custom-command"
                                value={customCommand}
                                onChange={(e) => setCustomCommand(e.target.value)}
                                placeholder="e.g., ls -la" 
                                rows={4}
                                className="font-mono"
                            />
                            <div className="flex justify-start">
                                <Button size="sm" onClick={() => { setCommandToRun(null); setIsCustomCommand(true); }} disabled={isPending || !customCommand}>
                                    <Send className="mr-2 h-4 w-4" /> Run Command
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
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
        
        <Dialog open={!!commandToRun || isCustomCommand} onOpenChange={() => { setCommandToRun(null); setIsCustomCommand(false); setCommandParams({}); }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Run: {commandToRun?.name || 'Custom Command'}</DialogTitle>
                    <DialogDescription>{commandToRun?.description || 'Enter parameters to run this custom command.'}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {commandToRun ? (
                        (commandToRun.parameters || []).map(param => (
                            <div key={param.key} className="space-y-2">
                                <Label htmlFor={param.key}>{param.label}</Label>
                                <Input
                                    id={param.key}
                                    value={commandParams[param.key] || ''}
                                    onChange={e => setCommandParams(prev => ({...prev, [param.key]: e.target.value}))}
                                    type={param.type === 'number' ? 'number' : 'text'}
                                />
                            </div>
                        ))
                    ) : (
                        <div className="space-y-2">
                             <Label htmlFor="custom-command-text">Command</Label>
                             <Textarea id="custom-command-text" value={customCommand} onChange={e => setCustomCommand(e.target.value)} rows={4} className="font-mono" />
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => { setCommandToRun(null); setIsCustomCommand(false); }}>Cancel</Button>
                    <Button onClick={commandToRun ? handleRunSavedCommand : () => handleRunCommand(customCommand, 'Custom Command')} disabled={isPending}>
                        {isPending && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
                        Run Command
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}
