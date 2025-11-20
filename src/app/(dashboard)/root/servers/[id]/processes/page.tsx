
'use client';
import { useCallback, useState, useEffect, use } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { AlertCircle, Trash2, Loader2, ArrowLeft } from 'lucide-react';
import { getActiveProcesses, type ProcessInfo } from '@/actions/server/management/get-active-processes';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { killProcess } from '@/actions/server/management/kill-process';
import PM2Status from '@/components/dashboard/server/PM2Status';
import Link from 'next/link';

export default function ProcessesStatusPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const id = params.id;
  const [processes, setProcesses] = useState<ProcessInfo[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [killingPid, setKillingPid] = useState<number | null>(null);
  const { toast } = useToast();

  const fetchProcesses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await getActiveProcesses(id);
    if (result.success) {
      setProcesses(result.processes || []);
    } else {
      setError(result.error || 'Failed to fetch active processes.');
    }
    setIsLoading(false);
  }, [id]);

  useEffect(() => {
    fetchProcesses();
  }, [fetchProcesses]);

  const handleKillProcess = async (pid: number) => {
    setKillingPid(pid);
    const result = await killProcess(id, pid);
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
        <div className="mb-4">
            <Button variant="ghost" asChild>
                <Link href={`/root/servers/${id}`}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Server
                </Link>
            </Button>
        </div>
        <PM2Status serverId={id} />
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
            <div className="space-y-2 pr-4">
                {processes.map((proc) => (
                  <div key={proc.pid} className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded-md hover:bg-muted group">
                    <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm truncate">PID: {proc.pid} ({proc.user})</p>
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

    