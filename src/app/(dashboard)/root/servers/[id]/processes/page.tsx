
'use client';
import { useCallback, useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { getActiveProcesses, type ProcessInfo } from '@/actions/server/management/get-active-processes';
import { Button } from '@/components/ui/button';
import PM2Status from '@/components/dashboard/server/PM2Status';
import Link from 'next/link';

export default function ProcessesStatusPage({ params }: { params: { id: string } }) {
  const { id } = params;
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
    <div className="w-full max-w-full overflow-x-hidden">
        <div className="mb-4">
            <Button variant="outline" asChild>
                <Link href={`/root/servers/${id}`}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Server
                </Link>
            </Button>
        </div>
      <div className="space-y-6">
        <PM2Status serverId={id} />
        <div>
          <div className="px-0">
            <h2 className="text-xl font-semibold">All Active Processes</h2>
            <p className="text-sm text-muted-foreground">A list of all running processes on the server, sorted by memory usage.</p>
          </div>
          <div className="mt-4">
            {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center p-2 border-b">
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
                      <div key={proc.pid} className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs p-2 bg-muted/50 rounded-md hover:bg-muted gap-2">
                        <div className="flex-1 min-w-0">
                            <p className="font-mono text-sm">PID: {proc.pid} ({proc.user})</p>
                            <p className="font-mono text-muted-foreground break-all">{proc.command}</p>
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
          </div>
        </div>
      </div>
    </div>
  );
};

