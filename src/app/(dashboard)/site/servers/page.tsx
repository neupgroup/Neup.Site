
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSiteServers, type Server } from '@/actions/servers';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Server as ServerIcon, HardDrive, ArrowRight, Settings, CreditCard, GitBranch } from 'lucide-react';
import type { ServerAllocation } from '@/schemas/server';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow } from 'date-fns';

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <Skeleton className="h-64 w-full" />
                 <Skeleton className="h-64 w-full" />
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {servers.map(({ allocation, ...server }) => {
                    // Placeholder for storage calculation
                    const storageUsed = 20; 
                    const lastDeployed = allocation.allocatedOn ? formatDistanceToNow(new Date(allocation.allocatedOn), { addSuffix: true }) : 'N/A';
                    return (
                        <Card key={server.id}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ServerIcon className="h-5 w-5" />
                                    {server.name}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h4 className="font-semibold text-sm mb-2">Deployment Status</h4>
                                    <div className="text-sm space-y-1 text-muted-foreground">
                                        <p>Last deployed: <span className="font-medium text-foreground">{lastDeployed}</span></p>
                                        <p>Pending deployments: <span className="font-medium text-foreground">No</span></p>
                                    </div>
                                    <Button asChild variant="outline" size="sm" className="mt-3 w-full">
                                        <Link href="/site/deploy">
                                            <GitBranch className="mr-2" /> Manage Deployments
                                        </Link>
                                    </Button>
                                </div>
                                <Separator />
                                <div>
                                    <h4 className="font-semibold text-sm mb-2">Server Status</h4>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <HardDrive className="h-4 w-4" />
                                                <span>Storage Status</span>
                                            </div>
                                            <span className="font-medium">{storageUsed}% filled</span>
                                        </div>
                                        <Progress value={storageUsed} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mt-4">
                                         <Button asChild variant="secondary" size="sm">
                                            <Link href={`/site/servers/${server.id}/storage`}>
                                                <Settings className="mr-2" /> Manage Server
                                            </Link>
                                        </Button>
                                        <Button asChild variant="secondary" size="sm">
                                            <Link href={`/site/billing`}>
                                                <CreditCard className="mr-2" /> Manage Billing
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
          )}
        </div>
    </div>
  );
}
