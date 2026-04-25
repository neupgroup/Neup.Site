
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getServers } from '@/services/servers';
import type { Server } from '@/schemas/server';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Plus, Server as ServerIcon, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { usePageTitle } from '@/hooks/use-page-title';

export default function ServersPage() {
  usePageTitle('Servers', 'NeupSites');
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServers = async () => {
      setLoading(true);
      const result = await getServers();
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
            <h1 className="font-headline text-2xl font-semibold tracking-tight">Your Servers</h1>
            <p className="text-muted-foreground">A list of servers you have created to deploy sites.</p>
        </div>
        <Button asChild>
          <Link href="/root/servers/create">
            <Plus className="mr-2 h-4 w-4" /> Create Server
          </Link>
        </Button>
      </header>
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4">
                 <Skeleton className="h-24 w-full" />
                 <Skeleton className="h-24 w-full" />
            </div>
          ) : error ? (
            <div className="p-4">
                <Alert variant="destructive" className="w-full">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
          ) : servers.length === 0 ? (
            <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
                <ServerIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No Servers Created</h3>
                <p>Click "Create Server" to get started.</p>
            </div>
          ) : (
             servers.map((server) => (
                <Card key={server.id} className="w-full">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                             <div className="flex-1">
                                <CardTitle className="hover:underline">
                                     <Link href={`/root/servers/${server.id}`}>
                                        {server.name}
                                     </Link>
                                </CardTitle>
                                <CardDescription className="font-mono">{server.publicIp}</CardDescription>
                            </div>
                             <div className="flex items-center gap-2">
                                {server.provider && <Badge variant="secondary">{server.provider}</Badge>}
                                {server.platform && <Badge variant="outline" className="capitalize">{server.platform}</Badge>}
                                <Button asChild variant="ghost" size="icon">
                                    <Link href={`/root/servers/${server.id}`}>
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                </Card>
             ))
          )}
        </div>
    </div>
  );
}
