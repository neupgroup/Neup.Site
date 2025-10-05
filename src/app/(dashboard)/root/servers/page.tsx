
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getServers, type Server } from '@/actions/servers';
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
import { AlertCircle, Plus, Server as ServerIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ServersPage() {
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
      <header className="flex items-center justify-between mb-4">
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
                <h3 className="text-lg font-semibold">No Servers Created</h3>
                <p>Click "Create Server" to get started.</p>
            </div>
          ) : (
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Public IP</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {servers.map((server) => (
                  <TableRow key={server.id}>
                    <TableCell className="font-medium">
                        <Link href={`/root/servers/${server.id}`} className="hover:underline">
                            {server.name}
                        </Link>
                    </TableCell>
                    <TableCell>
                        <a href={`http://${server.publicIp}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {server.publicIp}
                        </a>
                    </TableCell>
                    <TableCell>
                        <Badge variant={server.type === 'shared' ? 'secondary' : 'default'}>{server.type}</Badge>
                    </TableCell>
                    <TableCell>{server.createdAt ? new Date(server.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
    </div>
  );
}
