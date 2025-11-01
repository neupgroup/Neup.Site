
'use client';
import { useCallback, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { AlertCircle } from 'lucide-react';
import { getDetailedStorageForServer, type StorageInfo } from '@/actions/server/management/get-detailed-storage-for-server';

export default function StorageStatusPage({ params }: { params: { id: string } }) {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStorage = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await getDetailedStorageForServer(params.id);
    if (result.success && result.data) {
      setStorageInfo(result.data);
    } else {
      setError(result.error || 'Failed to fetch storage info.');
    }
    setIsLoading(false);
  }, [params.id]);
  
  useEffect(() => {
    fetchStorage();
  }, [fetchStorage]);

  return (
    <Card>
        <CardHeader>
            <CardTitle>Storage Status</CardTitle>
            <CardDescription>Real-time disk usage information.</CardDescription>
        </CardHeader>
        <CardContent>
        {isLoading ? (
            <div className="space-y-4">
            <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-full" />
            </div>
            <Skeleton className="h-8 w-1/2" />
            </div>
        ) : error ? (
            <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            </Alert>
        ) : storageInfo ? (
            <div className="space-y-4">
            <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                <p className="text-sm font-medium">{storageInfo.usePercentage} Used</p>
                <p className="text-sm text-muted-foreground">{storageInfo.used} of {storageInfo.size}</p>
                </div>
                <Progress value={parseInt(storageInfo.usePercentage)} />
            </div>
            <div className="grid grid-cols-2 text-sm">
                <div className="flex justify-between pr-4">
                    <span>Available:</span>
                    <span className="font-medium">{storageInfo.available}</span>
                </div>
                <div className="flex justify-between">
                    <span>Mounted On:</span>
                    <span className="font-mono">{storageInfo.mountedOn}</span>
                </div>
            </div>
            </div>
        ) : (
            <div className="text-center text-muted-foreground py-4">
            <p>Could not retrieve storage information.</p>
            </div>
        )}
        </CardContent>
    </Card>
  );
};
