
'use client';
import { useCallback, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { AlertCircle, Trash2, Loader2 } from 'lucide-react';
import { getActiveProcesses, type ProcessInfo } from '@/actions/server/management/get-active-processes';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { killProcess } from '@/actions/server/management/kill-process';
import PM2Status from '@/components/dashboard/server/PM2Status';

export default function ProcessesStatusPage({ params }: { params: { id: string } }) {
  const [processes, setProcesses] = useState<ProcessInfo[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [killingPid, setKillingPid] = useState<number | null>(null);
  const { toast } = useToast();

  const fetchProcesses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await getActiveProcesses(params.id);
    if (result.success) {
      setProcesses(result.processes || []);
    } else {
      setError(result.error || 'Failed to fetch active processes.');
    }
    setIsLoading(false);
  }, [params.id]);

  useEffect(() => {
    fetchProcesses();
  }, [fetchProcesses]);

  const handleKillProcess = async (pid: number) => {
    setKillingPid(pid);
    const result = await killProcess(params.id, pid);
    if (result.success) {
        toast({ title: 'Process Terminated', description: `Successfully sent termination signal to PID ${pid}.` });
        fetchProcesses();
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
    setKillingPid(null);
  }

  return (
    <div className="space-y-6">
        <PM2Status serverId={params.id} />
        <Card>
        <CardHeader>
            <CardTitle>All Active Processes</CardTitle>
            <CardDescription>A list of all running processes on the server, sorted by memory usage.</CardDescription>
        </CardHeader>
        <CardContent>
        {isLoading ? (
            <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex justify-between p-2">
                        <div className="space-y-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-48" />
                        </div>
                        <Skeleton className="h-4 w-20" />
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
            <ScrollArea className="h-96">
                <div className="space-y-2 pr-4">
                    {processes.map((proc) => (
                    <div key={proc.pid} className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded-md hover:bg-muted group">
                        <div>
                            <p className="font-mono text-sm">PID: {proc.pid} ({proc.user})</p>
                            <p className="font-mono truncate text-muted-foreground">{proc.command}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <p className="font-mono text-right flex-shrink-0">{proc.cpu}% CPU / {proc.mem.toFixed(2)} MB</p>
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {killingPid === proc.pid ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4 text-destructive" />}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will attempt to terminate process {proc.pid} ({proc.command}). This could have unintended consequences.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleKillProcess(proc.pid)}>
                                            Terminate
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                    ))}
                </div>
            </ScrollArea>
        ) : (
            <div className="text-center text-muted-foreground py-8">
            <p>No active processes found.</p>
            </div>
        )}
        </CardContent>
        </Card>
    </div>
  );
};
