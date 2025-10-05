'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSiteServers, type Server } from '@/actions/servers';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Server as ServerIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function SiteServersPage() {
  const [servers, setServers] = useState<Server[]>([]);
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
      <header className="flex items-center justify-between mb-4">
        <div>
            <h1 className="font-headline text-2xl font-semibold tracking-tight">Your Site's Servers</h1>
            <p className="text-muted-foreground">A list of servers allocated to this site.</p>
        </div>
      </header>
        <div className="border rounded-lg">
          {loading ? (
            <div className="p-4">
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
            <div className="text-center text-muted-foreground p-12">
                <ServerIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No Servers Assigned</h3>
                <p>There are no servers currently assigned to this site.</p>
            </div>
          ) : (
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Public IP</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Allocated Port</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {servers.map((server) => {
                    const allocation = server.allocations?.find(a => a.siteId); // In a real scenario, you'd filter by current siteId
                    return (
                        <TableRow key={server.id}>
                            <TableCell className="font-medium">
                                {server.name}
                            </TableCell>
                            <TableCell>
                                <a href={`http://${server.publicIp}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                    {server.publicIp}
                                </a>
                            </TableCell>
                            <TableCell>
                                <Badge variant={server.type === 'shared' ? 'secondary' : 'default'}>{server.type}</Badge>
                            </TableCell>
                            <TableCell>{allocation?.port || 'N/A'}</TableCell>
                        </TableRow>
                    )
                })}
              </TableBody>
            </Table>
          )}
        </div>
    </div>
  );
}
