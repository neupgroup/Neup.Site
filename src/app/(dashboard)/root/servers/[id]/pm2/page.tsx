
'use client';
import { useCallback, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import { getPm2Processes, type ProcessManagerInfo } from '@/actions/server/management/get-pm2-processes';

export default function PM2StatusPage({ params }: { params: { id: string } }) {
  const [processes, setProcesses] = useState<ProcessManagerInfo[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProcesses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await getPm2Processes(params.id);
    if (result.success) {
      setProcesses(result.processes || []);
    } else {
      setError(result.error || 'Failed to fetch PM2 processes.');
    }
    setIsLoading(false);
  }, [params.id]);

  useEffect(() => {
    fetchProcesses();
  }, [fetchProcesses]);

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
        <CardDescription>Real-time status of applications managed by PM2.</CardDescription>
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
  );
};
