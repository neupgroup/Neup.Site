
'use client';
import { useState, useEffect, use } from 'react';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';

import { getServer } from '@/services/servers';
import type { Server } from '@/services/server/type';

import { logErrorToDatabase } from '@/logica.logger';

import ServerInfoCard from '@/components/dashboard/server/ServerInfoCard';
import ServerLogs from '@/components/dashboard/server/ServerLogs';
import ServerManagement from '@/components/dashboard/server/ServerManagement';
import { usePageTitle } from '@/core/hooks/use-page-title';

export default function ServerDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [server, setServer] = useState<Server | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  usePageTitle(server ? `Server: ${server.name}` : 'Server Details', 'NeupSites');

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      try {
        const serverResult = await getServer(id);

        if (serverResult.success && serverResult.server) {
          setServer(serverResult.server);
        } else {
          setError(serverResult.error || 'Failed to fetch server details.');
          setLoading(false);
          return;
        }

      } catch (e: any) {
        setError('An unexpected error occurred while fetching server data.');
        logErrorToDatabase({
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
            <Button asChild variant="tertiary">
            <Link href="/root/servers">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Servers
            </Link>
            </Button>
        </div>
        <ServerInfoCard.Skeleton />
        <ServerManagement.Skeleton />
        <ServerLogs.Skeleton />
      </div>
    );
  }

  if (error || !server) {
    return (
      <div className="w-full">
        <div className="mb-4">
          <Button asChild variant="tertiary">
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
        <Button asChild variant="tertiary">
          <Link href="/root/servers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Servers
          </Link>
        </Button>
      </div>

      <ServerInfoCard 
        server={server}
      />
      
      <ServerManagement serverId={server.id} />
      
      <ServerLogs serverId={server.id} />
    </div>
  );
}
