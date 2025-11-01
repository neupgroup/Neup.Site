
'use client';
import { useCallback, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import { getActivePorts, type ActivePortInfo } from '@/actions/server/management/get-active-ports';

export default function NetworkStatusPage({ params }: { params: { id: string } }) {
  const [ports, setPorts] = useState<ActivePortInfo[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPorts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await getActivePorts(params.id);
    if (result.success) {
      setPorts(result.ports || []);
    } else {
      setError(result.error || 'Failed to fetch active ports.');
    }
    setIsLoading(false);
  }, [params.id]);

  useEffect(() => {
    fetchPorts();
  }, [fetchPorts]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Network Status</CardTitle>
        <CardDescription>A list of active TCP and UDP ports on the server.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : ports && ports.length > 0 ? (
            <div className="space-y-2">
              {ports.map((portInfo, index) => (
                <div key={`${portInfo.port}-${portInfo.protocol}-${index}`} className="flex justify-between items-center text-sm p-2 bg-muted/50 rounded-md hover:bg-muted">
                  <div className="flex items-center gap-4">
                    <span className="font-bold w-12">{portInfo.port}</span>
                    <Badge variant="outline" className="w-14 justify-center">{portInfo.protocol}</Badge>
                     {portInfo.process && (
                        <span className="font-mono text-xs text-muted-foreground truncate" title={portInfo.process}>
                          {portInfo.process}
                        </span>
                    )}
                  </div>
                  <span className="font-mono text-xs">{portInfo.address}</span>
                </div>
              ))}
            </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <p>No active ports found.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
