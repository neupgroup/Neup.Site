
'use client';
import { useCallback, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, Save, Trash2, FileText } from 'lucide-react';
import { getPm2Processes, managePm2Process, getPm2Logs, type ProcessManagerInfo } from '@/actions/server/management/get-pm2-processes';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

const LogViewer = ({ serverId, processId, processName }: { serverId: string, processId: number, processName: string }) => {
    const [logs, setLogs] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchLogs = async () => {
        setIsLoading(true);
        setError(null);
        const result = await getPm2Logs(serverId, processId);
        if (result.success) {
            setLogs(result.logs || 'No logs found.');
        } else {
            setError(result.error || 'Failed to fetch logs.');
        }
        setIsLoading(false);
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" onClick={fetchLogs}>
                    <FileText className="mr-2 h-4 w-4" />
                    Logs
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Logs for {processName}</DialogTitle>
                    <DialogDescription>
                        Showing the last 100 lines of logs.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1 rounded-md border bg-muted/50 p-4">
                     {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : error ? (
                         <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    ) : (
                        <pre className="text-xs whitespace-pre-wrap break-all font-mono">
                            <code>{logs}</code>
                        </pre>
                    )}
                </ScrollArea>
                <DialogFooter>
                    <Button onClick={fetchLogs} disabled={isLoading}>
                         {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                         Refresh
                    </Button>
                    <DialogClose asChild>
                        <Button variant="outline">Close</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function PM2Status({ serverId }: { serverId: string }) {
  const [processes, setProcesses] = useState<ProcessManagerInfo[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProcesses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await getPm2Processes(serverId);
    if (result.success) {
      setProcesses(result.processes || []);
    } else {
      setError(result.error || 'Failed to fetch PM2 processes.');
    }
    setIsLoading(false);
  }, [serverId]);

  useEffect(() => {
    fetchProcesses();
  }, [fetchProcesses]);
  
  const handleSave = async () => {
      setIsSaving(true);
      const result = await managePm2Process(serverId, 'save');
      if (result.success) {
          toast({ title: 'Process List Saved', description: 'Your current PM2 process list will now restart on server reboot.' });
      } else {
          toast({ variant: 'destructive', title: 'Error Saving List', description: result.error });
      }
      setIsSaving(false);
  };
  
  const handleDelete = async (processId: number) => {
      setDeletingId(processId);
      const result = await managePm2Process(serverId, 'delete', processId);
      if (result.success) {
          toast({ title: 'Process Removed', description: `Process ${processId} has been removed from PM2.` });
          fetchProcesses(); // Refresh list after deleting
      } else {
          toast({ variant: 'destructive', title: 'Error Removing Process', description: result.error });
      }
      setDeletingId(null);
  };


  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge variant="default" className="bg-green-600">Online</Badge>;
      case 'stopping':
      case 'stopped':
        return <Badge variant="secondary">Stopped</Badge>;
      case 'launching':
        return <Badge variant="outline">Launching</Badge>;
      case 'errored':
      case 'failed':
        return <Badge variant="destructive">Errored</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>PM2 Processes</CardTitle>
        <CardDescription>Status of applications managed by PM2.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                    <div key={i} className="flex justify-between p-2">
                        <div className="space-y-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-48" />
                        </div>
                        <Skeleton className="h-5 w-16" />
                    </div>
                ))}
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : processes && processes.length > 0 ? (
            <div className="space-y-2">
                {processes.map((proc) => (
                  <div key={proc.id} className="p-2 bg-muted/50 rounded-md hover:bg-muted flex justify-between items-center">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-semibold truncate">{proc.name}</span>
                          {getStatusBadge(proc.status)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 truncate">
                          <span>{proc.cpu}% CPU / {proc.memory}</span> | 
                          <span> Uptime: {proc.uptime}</span> |
                          <span> Restarts: {proc.restarts}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <LogViewer serverId={serverId} processId={proc.id} processName={proc.name} />
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={deletingId === proc.id}>
                                    {deletingId === proc.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4 text-destructive" />}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will stop and remove the process "{proc.name}" (ID: {proc.id}) from PM2.
                                        This action does not delete your application files.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(proc.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
          ) : (
            <div className="text-center text-muted-foreground p-8">
              <p>No PM2 processes found or PM2 is not installed.</p>
            </div>
          )}
      </CardContent>
      {processes && processes.length > 0 && (
          <CardFooter>
              <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Process List
              </Button>
          </CardFooter>
      )}
    </Card>
  );
};

    