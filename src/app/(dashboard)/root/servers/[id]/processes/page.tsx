
'use client';
import { useCallback, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { getActiveProcesses, type ProcessInfo } from '@/actions/server/management/get-active-processes';
import { getPm2Processes, type ProcessManagerInfo } from '@/actions/server/management/get-pm2-processes';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

const PM2StatusSection = ({ serverId }: { serverId: string }) => {
    const [processes, setProcesses] = useState<ProcessManagerInfo[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'online': return <Badge variant="default" className="bg-green-600">Online</Badge>;
            case 'stopped': return <Badge variant="secondary">Stopped</Badge>;
            case 'errored': return <Badge variant="destructive">Errored</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
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
                        {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                    </div>
                ) : error ? (
                    <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>
                ) : processes && processes.length > 0 ? (
                    <div className="space-y-2">
                        {processes.map((proc) => (
                            <div key={proc.id} className="p-2 bg-muted/50 rounded-md hover:bg-muted">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-semibold truncate">{proc.name}</span>
                                    {getStatusBadge(proc.status)}
                                </div>
                                <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
                                    <span>{proc.cpu}% CPU / {proc.memory}</span>
                                    <span>{proc.uptime} / {proc.restarts} restarts</span>
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
        </Card>
    )
}

export default function ProcessesStatusPage({ params }: { params: { id: string } }) {
  const [processes, setProcesses] = useState<ProcessInfo[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="space-y-6">
        <PM2StatusSection serverId={params.id} />
        <Card>
        <CardHeader>
            <CardTitle>All Active Processes</CardTitle>
            <CardDescription>A list of all running processes on the server.</CardDescription>
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
                    <div key={proc.pid} className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded-md hover:bg-muted">
                        <div>
                            <p className="font-mono text-sm">PID: {proc.pid} ({proc.user})</p>
                            <p className="font-mono truncate text-muted-foreground">{proc.command}</p>
                        </div>
                        <p className="font-mono text-right flex-shrink-0 ml-4">{proc.cpu}% CPU / {proc.mem}% MEM</p>
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
