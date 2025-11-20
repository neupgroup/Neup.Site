
'use client';
import { useCallback, useState, useEffect, use } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { getActiveProcesses, type ProcessInfo } from '@/actions/server/management/get-active-processes';
import { Button } from '@/components/ui/button';
import PM2Status from '@/components/dashboard/server/PM2Status';
import Link from 'next/link';

export default function ProcessesStatusPage({ params }: { params: { id: string } }) {
  const { id } = use(params);
  const [processes, setProcesses] = useState<ProcessInfo[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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

  return (
    <div className="space-y-6">
        <div className="mb-4">
            <Button variant="outline" asChild>
                <Link href={`/root/servers/${id}`}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Server
                </Link>
            </Button>
        </div>
        <PM2Status serverId={id} />
        <div>
          <CardHeader className="px-0">
            <CardTitle>All Active Processes</CardTitle>
            <CardDescription>A list of all running processes on the server, sorted by memory usage.</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
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
            <div className="space-y-2 pr-0 sm:pr-4">
                {processes.map((proc) => (
                  <div key={proc.pid} className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs p-2 bg-muted/50 rounded-md hover:bg-muted group gap-2">
                    <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm truncate">PID: {proc.pid} ({proc.user})</p>
                        <p className="font-mono truncate text-muted-foreground">{proc.command}</p>
                    </div>
                    <div className="flex items-center justify-between w-full sm:w-auto sm:justify-end gap-2 mt-2 sm:mt-0">
                        <p className="font-mono text-right flex-shrink-0">{proc.cpu}% CPU / {proc.mem.toFixed(2)} MB</p>
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
        </div>
    </div>
  );
};
