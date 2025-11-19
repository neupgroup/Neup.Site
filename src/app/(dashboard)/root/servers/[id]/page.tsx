
'use client';
import { useState, useEffect, use } from 'react';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';

import { getServer, type Server } from '@/actions/servers';
import { getUptime } from '@/actions/server/management/get-uptime';
import { getStorageUsage } from '@/actions/server/management/get-storage-usage';
import { getMemoryUsage } from '@/actions/server/management/get-memory-usage';

import { logErrorToFirestore } from '@/lib/logging';

import ServerInfoCard from '@/components/dashboard/server/ServerInfoCard';
import ServerLogs from '@/components/dashboard/server/ServerLogs';
import ServerManagement from '@/components/dashboard/server/ServerManagement';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, Warehouse, User, Folder, Clock, HardDrive, Cpu, Wifi, ListTree, Share2, ServerCrash, RefreshCw, Loader2 } from 'lucide-react';

const DetailItemSkeleton = ({ icon: Icon, label, skeletonWidth = 'w-32' }: { icon: React.ElementType, label: string, skeletonWidth?: string }) => (
    <div>
        <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2"><Icon className="h-4 w-4" />{label}</h4>
        <Skeleton className={`h-5 mt-1 ${skeletonWidth}`} />
    </div>
);


export default function ServerDetailPage({ params }: { params: { id: string } }) {
  const { id } = use(params);
  const [server, setServer] = useState<Server | null>(null);
  const [uptime, setUptime] = useState<string | null>(null);
  const [storage, setStorage] = useState<{ used: string, total: string, unit: string } | null>(null);
  const [memory, setMemory] = useState<{ used: number, total: number, unit: string } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [
          serverResult,
          uptimeResult,
          storageResult,
          memoryResult,
        ] = await Promise.all([
          getServer(id),
          getUptime(id),
          getStorageUsage(id),
          getMemoryUsage(id),
        ]);

        if (serverResult.success && serverResult.server) {
          setServer(serverResult.server);
        } else {
          setError(serverResult.error || 'Failed to fetch server details.');
          setLoading(false);
          return;
        }

        if (uptimeResult.success) setUptime(uptimeResult.uptime || null);
        if (storageResult.success) setStorage(storageResult.data || null);
        if (memoryResult.success) setMemory(memoryResult.data || null);

      } catch (e: any) {
        setError('An unexpected error occurred while fetching server data.');
        logErrorToFirestore({
          message: `Client-side error fetching server details for serverId: ${id}. Error: ${e.message}`,
          stack: e.stack,
          source: 'ServerDetailPage.fetchInitialData',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [id]);

  if (loading) {
    return (
      <div className="w-full space-y-6">
        <div className="mb-4">
            <Button asChild variant="outline">
            <Link href="/root/servers">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Servers
            </Link>
            </Button>
        </div>
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <Skeleton className="h-8 w-48 mb-2" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-20" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-4 border-t">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <DetailItemSkeleton icon={Globe} label="Public IP" skeletonWidth="w-36" />
                    <DetailItemSkeleton icon={Warehouse} label="Provider" />
                    <DetailItemSkeleton icon={User} label="Default Username" skeletonWidth="w-24"/>
                    <DetailItemSkeleton icon={Folder} label="Base Path" />
                    <DetailItemSkeleton icon={Folder} label="App Path" />
                    <DetailItemSkeleton icon={Clock} label="Uptime" />
                    <DetailItemSkeleton icon={HardDrive} label="Storage" />
                    <DetailItemSkeleton icon={Cpu} label="Processes (RAM)" />
                    <DetailItemSkeleton icon={Wifi} label="Network" />
                </div>
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2">
                <Skeleton className="h-9 w-36" />
                <Skeleton className="h-9 w-40" />
                <Skeleton className="h-9 w-36" />
            </CardFooter>
        </Card>
         <Card>
             <CardHeader>
                 <CardTitle>Server Management</CardTitle>
                 <CardDescription>Perform common server maintenance and setup tasks.</CardDescription>
             </CardHeader>
             <CardContent>
                 <Skeleton className="h-40 w-full" />
             </CardContent>
         </Card>
        <Card>
            <CardHeader>
                <CardTitle>Server Logs</CardTitle>
                <CardDescription>History of all commands run on this server.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
                </div>
            </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !server) {
    return (
      <div className="w-full">
        <div className="mb-4">
          <Button asChild variant="outline">
            <Link href="/root/servers">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Servers
            </Link>
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || 'Server not found.'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="mb-4">
        <Button asChild variant="outline">
          <Link href="/root/servers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Servers
          </Link>
        </Button>
      </div>

      <ServerInfoCard 
        server={server} 
        initialUptime={uptime} 
        initialStorage={storage}
        initialMemory={memory}
      />
      
      <ServerManagement serverId={server.id} />
      
      <ServerLogs serverId={server.id} />
    </div>
  );
}
