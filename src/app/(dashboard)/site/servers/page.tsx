
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSiteServers, type Server } from '@/actions/servers';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Server as ServerIcon, HardDrive, ArrowRight } from 'lucide-react';
import type { ServerAllocation } from '@/schemas/server';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

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
        <div className="space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <Skeleton className="h-48 w-full" />
                 <Skeleton className="h-48 w-full" />
                 <Skeleton className="h-48 w-full" />
            </div>
          ) : error ? (
            <Alert variant="destructive" className="w-full">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : servers.length === 0 ? (
            <Card className="w-full">
                <CardContent className="text-center text-muted-foreground p-12">
                    <ServerIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">No Servers Assigned</h3>
                    <p>There are no servers currently assigned to this site.</p>
                </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {servers.map(({ allocation, ...server }) => {
                    // Placeholder for storage calculation
                    const storageUsed = 20; 
                    return (
                        <Card key={server.id}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ServerIcon className="h-5 w-5" />
                                    {server.name}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <HardDrive className="h-4 w-4" />
                                            <span>Storage</span>
                                        </div>
                                        <span className="font-medium">{storageUsed}% filled</span>
                                    </div>
                                    <Progress value={storageUsed} />
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button asChild variant="outline" className="w-full">
                                    <Link href={`/site/servers/${allocation.id}/storage`}>
                                        View More <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    )
                })}
            </div>
          )}
        </div>
    </div>
  );
}
