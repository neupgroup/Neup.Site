

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RotateCcw, HardDrive } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { getAppBaseBackups, restoreAppBaseBackup, type AppBaseBackup } from '@/server/app-base';
import { getSiteServers } from '@/server/servers';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { usePageTitle } from '@/hooks/use-page-title';

export default function BackupsPage() {
  usePageTitle('App Base Backups');
  const [backups, setBackups] = useState<AppBaseBackup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchBackups = async () => {
      setLoading(true);
      const result = await getAppBaseBackups();
      if (result.success && result.backups) {
        setBackups(result.backups);
      } else {
        setError(result.error || 'Failed to fetch backups.');
      }
      setLoading(false);
    };
    fetchBackups();
  }, []);
  
  const handleRestore = async (backupId: string) => {
    setRestoringId(backupId);
    const serverResult = await getSiteServers();
    if (!serverResult.success || !serverResult.servers || serverResult.servers.length === 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'No server allocated to this site.' });
      setRestoringId(null);
      return;
    }
    const serverId = serverResult.servers[0].id;

    const result = await restoreAppBaseBackup(backupId, serverId);
    if(result.success) {
      toast({ title: "Restore Successful", description: "The file has been restored from the backup."});
    } else {
      toast({ variant: 'destructive', title: "Restore Failed", description: result.error });
    }
    setRestoringId(null);
  }

  return (
    <div className="w-full">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-headline text-2xl font-semibold tracking-tight">App Base Backups</h1>
          <p className="text-muted-foreground">View and restore backups of your base configuration files.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/site/appbase">
            Back to App Base
          </Link>
        </Button>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Backup History</CardTitle>
          <CardDescription>A list of all backups for files in your `base` directory.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
          ) : error ? (
            <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>
          ) : backups.length === 0 ? (
            <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
              <HardDrive className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No Backups Found</h3>
              <p>Create a backup from the App Base page.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Filename</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Backed Up At</TableHead>
                  <TableHead>Backed Up By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backups.map((backup) => (
                  <TableRow key={backup.id}>
                    <TableCell className="font-mono">{backup.fileName}</TableCell>
                    <TableCell>
                      <Badge variant={backup.fileType === 'internal' ? 'secondary' : 'outline'}>
                        {backup.fileType === 'internal' ? 'Internal' : 'External'}
                      </Badge>
                    </TableCell>
                    <TableCell>{backup.backedUpAt ? format(new Date(backup.backedUpAt), 'PPpp') : 'N/A'}</TableCell>
                    <TableCell className="font-mono text-xs">{backup.backedUpBy}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="secondary" size="sm" onClick={() => handleRestore(backup.id)} disabled={!!restoringId}>
                           {restoringId === backup.id ? 'Restoring...' : 'Restore'}
                        </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
