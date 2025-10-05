
'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { getServer, deleteServer, type Server } from '@/actions/servers';
import { getServerLogs, createServerLog, type ServerLog } from '@/actions/server-logs';
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
import { AlertCircle, ArrowLeft, Pencil, Trash2, Share2, Package, GitCommit, Disc, Terminal, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';

export default function ServerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [server, setServer] = useState<Server | null>(null);
  const [logs, setLogs] = useState<ServerLog[]>([]);
  const [logsPage, setLogsPage] = useState(1);
  const [hasMoreLogs, setHasMoreLogs] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [swapSize, setSwapSize] = useState('3072');
  const [runningCommand, setRunningCommand] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const fetchLogs = async (page = 1) => {
    setLoadingLogs(true);
    setLogsError(null);
    const result = await getServerLogs({ serverId: id, page });
    if (result.success && result.logs) {
        setLogs(prev => (page === 1 ? result.logs! : [...prev, ...result.logs!]));
        setHasMoreLogs(result.hasMore || false);
    } else {
        setLogsError(result.error || 'Failed to load logs.');
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
        setError(result.error || 'Failed to fetch server.');
      }
      setLoading(false);
    };

    fetchInitialData();
    fetchLogs(1);
  }, [id]);

  const handleRunCommand = async (command: string, description: string) => {
    setRunningCommand(command);
    // Simulate API call and log creation
    const logResult = await createServerLog({ serverId: id, command, output: `Running: ${description}...`, status: 'running' });
    
    // Refresh logs to show the 'running' state
    await fetchLogs(1);

    // Simulate command execution
    setTimeout(async () => {
        // In a real app, you would have an actual result.
        // For now, we just update the log to success.
        const output = `Successfully completed: ${description}.`;
        const status: 'success' | 'error' = 'success';
        
        // This is where you would update the log, but since we don't have that action,
        // we'll just create a new one for demonstration. For a real app, you'd implement `updateServerLog`.
        await createServerLog({ serverId: id, command, output, status });
        
        toast({ title: 'Command Finished', description });
        setRunningCommand(null);
        await fetchLogs(1); // Refresh logs again
    }, 3000);
  }
  
  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    const result = await deleteServer(id);
    if(result.success) {
        toast({ title: 'Server Deleted', description: 'The server has been removed.'});
        router.push('/root/servers');
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
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
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <h4 className="font-medium">Update &amp; Upgrade Server</h4>
                <p className="text-sm text-muted-foreground">Run apt-get update &amp;&amp; apt-get upgrade.</p>
              </div>
              <Button onClick={() => handleRunCommand('update', 'Update &amp; Upgrade')} disabled={!!runningCommand}>
                  {runningCommand === 'update' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <GitCommit className="mr-2 h-4 w-4" />}
                  {runningCommand === 'update' ? 'Running...' : 'Run Update'}
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
               <div>
                <h4 className="font-medium">Install npm</h4>
                <p className="text-sm text-muted-foreground">Install Node.js and the Node Package Manager.</p>
              </div>
              <Button onClick={() => handleRunCommand('npm', 'Install npm')} disabled={!!runningCommand}>
                 {runningCommand === 'npm' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Package className="mr-2 h-4 w-4" />}
                 {runningCommand === 'npm' ? 'Installing...' : 'Install npm'}
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
                    <Button className="ml-auto" onClick={() => handleRunCommand('swap', `Create ${swapSize}MB Swap`)} disabled={!!runningCommand}>
                        {runningCommand === 'swap' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Disc className="mr-2 h-4 w-4" />}
                        {runningCommand === 'swap' ? 'Creating...' : 'Create Swap'}
                    </Button>
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
                    <div className="space-y-4">
                        {logs.map(log => (
                             <div key={log.id} className="border p-3 rounded-md">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {log.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                                        {log.status === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
                                        {log.status === 'running' && <Loader2 className="h-4 w-4 animate-spin" />}
                                        <p className="font-mono text-sm">{log.command}</p>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{log.timestamp ? formatDistanceToNow(new Date(log.timestamp), { addSuffix: true }) : 'Just now'}</p>
                                </div>
                                <pre className="text-xs bg-muted p-2 mt-2 rounded-md overflow-x-auto whitespace-pre-wrap font-mono">{log.output}</pre>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
            {hasMoreLogs && (
                <CardFooter>
                    <Button variant="outline" className="w-full" onClick={() => fetchLogs(logsPage + 1)} disabled={loadingLogs}>
                        {loadingLogs ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                        Show More
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

    