
'use client';
import { useState, useEffect, use } from 'react';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';

import { getServer, type Server } from '@/actions/servers';
import { getUptime } from '@/actions/server/management/get-uptime';

import { logErrorToFirestore } from '@/lib/logging';

import ServerInfoCard from '@/components/dashboard/server/ServerInfoCard';
import ServerStatusAccordion from '@/components/dashboard/server/ServerStatusAccordion';
import ServerLogs from '@/components/dashboard/server/ServerLogs';
import ServerManagement from '@/components/dashboard/server/ServerManagement';

export default function ServerDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [server, setServer] = useState<Server | null>(null);
  const [uptime, setUptime] = useState<string | null>(null);

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
        ] = await Promise.all([
          getServer(id),
          getUptime(id),
        ]);

        if (serverResult.success && serverResult.server) {
          setServer(serverResult.server);
        } else {
          setError(serverResult.error || 'Failed to fetch server details.');
          setLoading(false);
          return;
        }

        if (uptimeResult.success) setUptime(uptimeResult.uptime || null);

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
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
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
        <Button variant="ghost" asChild>
          <Link href="/root/servers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Servers
          </Link>
        </Button>
      </div>

      <ServerInfoCard server={server} initialUptime={uptime} />

      <ServerManagement serverId={server.id} />
      
      <ServerStatusAccordion serverId={server.id} />
      
      <ServerLogs serverId={server.id} />
    </div>
  );
}
