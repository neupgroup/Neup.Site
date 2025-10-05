
'use client';

import { useState, useEffect, use } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { getFirestore, doc, getDoc, Timestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/lib/firebase';
import type { ServerLog } from '@/schemas/server';


async function getLogById(logId: string): Promise<{ log?: ServerLog, error?: string }> {
    try {
        const { firestore } = initializeFirebase();
        const docRef = doc(firestore, 'serverLogs', logId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return { error: 'Log not found.' };
        }

        const data = docSnap.data();
        const log: ServerLog = {
            id: docSnap.id,
            serverId: data.serverId,
            command: data.command,
            output: data.output,
            status: data.status,
            initiatedBy: data.initiatedBy,
            initiatedAt: data.initiatedAt instanceof Timestamp ? data.initiatedAt.toDate().toISOString() : null,
            completedAt: data.completedAt instanceof Timestamp ? data.completedAt.toDate().toISOString() : null,
        };

        return { log };
    } catch (e: any) {
        console.error(`Failed to fetch log with ID ${logId}:`, e);
        return { error: e.message || `Unknown error occurred while fetching log ${logId}.` };
    }
}


export default function FullLogPage({ params }: { params: Promise<{ id: string, logId: string }> }) {
  const { id: serverId, logId } = use(params);
  const [log, setLog] = useState<ServerLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchError = async () => {
      setLoading(true);
      const { log, error } = await getLogById(logId);
      if (log) {
        setLog(log);
      } else {
        setError(error || 'Unknown error occurred.');
      }
      setLoading(false);
    };

    fetchError();
  }, [logId]);

  if (loading) {
    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader className="space-y-2">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-96 w-full" />
            </CardContent>
        </Card>
    );
  }

  if (error || !log) {
    return (
        <div className="w-full max-w-4xl mx-auto space-y-4">
             <Button asChild variant="ghost" className="mb-4">
                <Link href={`/root/servers/${serverId}/logs`}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Logs
                </Link>
            </Button>
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Fetching Log</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
        <Button asChild variant="ghost">
            <Link href={`/root/servers/${log.serverId}/logs`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Logs
            </Link>
        </Button>
      <Card>
        <CardHeader>
          <CardTitle>Full Log Details</CardTitle>
          <CardDescription>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <span><strong>Log ID:</strong> {log.id}</span>
                <span><strong>Server ID:</strong> {log.serverId}</span>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-2">
                <h3 className="font-semibold text-lg">Command</h3>
                <p className="font-mono bg-muted p-3 rounded-md text-sm whitespace-pre-wrap break-words">{log.command}</p>
            </div>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                    <h4 className="font-semibold text-muted-foreground text-sm">Status</h4>
                    <Badge variant={log.status === 'completed' ? 'default' : log.status === 'failed' ? 'destructive' : 'secondary'}>{log.status}</Badge>
                </div>
                 <div>
                    <h4 className="font-semibold text-muted-foreground text-sm">Initiated By</h4>
                    <p>{log.initiatedBy}</p>
                </div>
                 <div>
                    <h4 className="font-semibold text-muted-foreground text-sm">Initiated At</h4>
                    <p>{log.initiatedAt ? new Date(log.initiatedAt).toLocaleString() : 'N/A'}</p>
                </div>
                <div>
                    <h4 className="font-semibold text-muted-foreground text-sm">Completed At</h4>
                    <p>{log.completedAt ? new Date(log.completedAt).toLocaleString() : 'N/A'}</p>
                </div>
             </div>
            <Separator />
            <div className="space-y-2">
                <h3 className="font-semibold text-lg">Full Output</h3>
                <pre className="bg-black text-white p-4 rounded-md text-xs whitespace-pre-wrap break-all font-mono overflow-auto max-h-[70vh]">
                    {log.output || 'No output from this command.'}
                </pre>
            </div>
        </CardContent>
      </Card>
    </div>
  );
};
