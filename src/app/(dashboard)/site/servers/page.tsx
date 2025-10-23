
'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import Link from 'next/link';
import { getSiteServers, type Server } from '@/actions/servers';
import { getDetailedStorage } from '@/actions/server/management/get-detailed-storage';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { AlertCircle, Server as ServerIcon, HardDrive, Settings, RefreshCw, Loader2, FileCode, Folder, BarChart as BarChartIcon } from 'lucide-react';
import type { ServerAllocation, ServerAllocationStorage } from '@/schemas/server';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

const StorageMetric: React.FC<{ icon: React.ElementType; label: string; value: string; unit: string; description: string; }> = ({ icon: Icon, label, value, unit, description }) => (
    <div className="flex items-start gap-4 p-4 rounded-lg bg-card border">
        <div className="p-3 bg-primary/10 rounded-lg">
             <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value} <span className="text-base font-medium text-muted-foreground">{unit}</span></p>
            <p className="text-xs text-muted-foreground">{description}</p>
        </div>
    </div>
);

const ServerDetailCard = ({ server, allocation }: { server: Server, allocation: ServerAllocation }) => {
    const [storageData, setStorageData] = useState<ServerAllocationStorage | null>(allocation.storage || null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        setError(null);
        const result = await getDetailedStorage(allocation.id, server.id, allocation.deploymentPath!, allocation.username);
        if (result.success && result.data) {
            setStorageData(result.data);
            toast({ title: "Storage Refreshed" });
        } else {
            setError(result.error || "Failed to calculate storage.");
            toast({ variant: 'destructive', title: "Failed to Refresh Storage", description: result.error });
        }
        setIsRefreshing(false);
    }, [allocation.id, server.id, allocation.deploymentPath, allocation.username, toast]);

    useEffect(() => {
        if (!storageData) {
            handleRefresh();
        }
    }, [storageData, handleRefresh]);


    return (
        <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <CardTitle className="flex items-start gap-2 break-words">
                        <ServerIcon className="h-5 w-5 mt-1 flex-shrink-0" />
                        <span className="break-all">{server.name}</span>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground font-mono break-all">{server.publicIp}</p>
                </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-4 border-t">
                 {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                {isRefreshing && !storageData ? (
                    <div className="space-y-4">
                        <Skeleton className="h-28 w-full" />
                        <Skeleton className="h-28 w-full" />
                    </div>
                ) : storageData ? (
                     <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <StorageMetric icon={HardDrive} label="Total Allocated" value={allocation.storageAllocation} unit="MB" description="Total disk space allocated to this site." />
                            <StorageMetric icon={HardDrive} label="Available Storage" value={storageData.availableStorage} unit={storageData.unit} description="Free space remaining on the server." />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <StorageMetric icon={ServerIcon} label="System Storage" value={storageData.systemStorage} unit={storageData.unit} description="Space used by the OS and other services." />
                            <StorageMetric icon={FileCode} label="Codebase Storage" value={storageData.codebaseStorage} unit={storageData.unit} description="Space used by your application code." />
                            <StorageMetric icon={Folder} label="Assets Storage" value={storageData.assetsStorage} unit={storageData.unit} description="Space used by the /assets folder." />
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
                        <HardDrive className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <p>Click "Recalculate" to fetch storage details.</p>
                    </div>
                )}
            </CardContent>
            <CardFooter>
                 <Button onClick={handleRefresh} disabled={isRefreshing || !allocation.deploymentPath} size="sm">
                    {isRefreshing ? <Loader2 className="animate-spin mr-2"/> : <RefreshCw className="mr-2" />}
                    Recalculate
                </Button>
            </CardFooter>
        </Card>
    )
}

export default function SiteServersPage() {
  const [servers, setServers] = useState<(Server & { allocation: ServerAllocation })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServers = async () => {
      setLoading(true);
      const result = await getSiteServers();
      if (result.success && result.servers) {
        setServers(result.servers);
      } else {
        setError(result.error || 'Failed to fetch servers');
      }
      setLoading(false);
    };

    fetchServers();
  }, []);

  return (
    <div className="w-full">
      <header className="flex items-center justify-between mb-8">
        <div>
            <h1 className="font-headline text-2xl font-semibold tracking-tight">Your Site's Servers</h1>
            <p className="text-muted-foreground">A list of servers allocated to this site.</p>
        </div>
      </header>
        <div className="space-y-8">
          {loading ? (
            <div className="space-y-4">
                 <Skeleton className="h-32 w-full" />
                 <Skeleton className="h-32 w-full" />
            </div>
          ) : error ? (
            <Alert variant="destructive" className="w-full">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : servers.length === 0 ? (
            <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
                <ServerIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No Servers Assigned</h3>
                <p>There are no servers currently assigned to this site.</p>
            </div>
          ) : (
            <div className="space-y-6">
                {servers.map(({ allocation, ...server }) => (
                    <ServerDetailCard key={server.id} server={server} allocation={allocation} />
                ))}
            </div>
          )}
        </div>
    </div>
  );
}
