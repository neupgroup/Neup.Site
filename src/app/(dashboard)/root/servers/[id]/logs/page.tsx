
'use client';
import { useState, useEffect, useTransition, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getServerLogs, type ServerLog } from '@/actions/server-logs';
import { logErrorToFirestore } from '@/lib/logging';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft, Terminal, CheckCircle, XCircle, Loader2, Send, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const FullLog = ({ log }: { log: ServerLog }) => {
    return (
        <div className="space-y-2">
            <pre className="text-xs bg-black text-white p-3 mt-2 rounded-md overflow-x-auto whitespace-pre-wrap font-mono">
                {log.output || 'No output from this command.'}
            </pre>
             {log.completedAt && (
                <p className="text-xs text-muted-foreground mt-2 text-right">Completed: {new Date(log.completedAt).toLocaleString()}</p>
            )}
        </div>
    );
};

export default function ServerLogsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [logs, setLogs] = useState<ServerLog[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const logsPage = Number(searchParams.get('page')) || 1;
  const [hasMoreLogs, setHasMoreLogs] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [logsError, setLogsError] = useState<string | null>(null);

  const fetchLogs = async (page = 1) => {
    setLoadingLogs(true);
    setLogsError(null);
    const result = await getServerLogs({ serverId: id, page, pageSize: 5 });

    if (result.success && result.logs) {
        setLogs(result.logs!);
        setHasMoreLogs(result.hasMore || false);
    } else {
        const errorMessage = result.error || 'Failed to load logs.';
        setLogsError(errorMessage);
        logErrorToFirestore({
            message: `Client-side error in fetchLogs for serverId: ${id}. Error: ${errorMessage}`,
            stack: new Error().stack,
            source: 'ServerLogsPage.fetchLogs',
        });
    }
    setLoadingLogs(false);
  }
  
   useEffect(() => {
    fetchLogs(logsPage);
  }, [id, logsPage]);
  
  useEffect(() => {
    const hasOngoingLog = logs.some(log => log.status === 'ongoing' || log.status === 'pending');
    let interval: NodeJS.Timeout | null = null;
    if (hasOngoingLog) {
      interval = setInterval(() => {
        fetchLogs(logsPage);
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [logs, id, logsPage]);

  const handlePageChange = (newPage: number) => {
    router.push(`/root/servers/${id}/logs?page=${newPage}`);
  };

  return (
    <div className="w-full space-y-6">
        <div className="mb-4">
            <Button variant="ghost" asChild>
                <Link href={`/root/servers/${id}`}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Server
                </Link>
            </Button>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Server Logs</CardTitle>
                <CardDescription>History of all commands run on this server.</CardDescription>
            </CardHeader>
            <CardContent>
                {loadingLogs && logs.length === 0 ? (
                    <div className="space-y-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                ) : logsError ? (
                     <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error Loading Logs</AlertTitle>
                        <AlertDescription className="break-all">{logsError}</AlertDescription>
                    </Alert>
                ) : logs.length === 0 ? (
                    <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
                        <Terminal className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold">No Logs Found</h3>
                        <p>Run a command from the Server Management section to see logs here.</p>
                    </div>
                ) : (
                    <Accordion type="single" collapsible className="w-full space-y-2">
                        {logs.map(log => (
                            <AccordionItem value={log.id} key={log.id} className="border rounded-md px-4 cursor-pointer hover:bg-muted/50">
                                <AccordionTrigger>
                                    <div className="flex flex-col items-start text-left w-full gap-2">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Badge variant={log.status === 'completed' ? 'default' : log.status === 'failed' ? 'destructive' : 'secondary'}>
                                                {log.status === 'ongoing' && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                                                {log.status}
                                            </Badge>
                                            <span>{log.initiatedAt ? formatDistanceToNow(new Date(log.initiatedAt), { addSuffix: true }) : 'Just now'}</span>
                                            <span>by {log.initiatedBy}</span>
                                        </div>
                                        <p className="font-mono text-sm break-all">{log.command}</p>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <FullLog log={log} />
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                )}
            </CardContent>
             {(logsPage > 1 || hasMoreLogs) && (
                <CardFooter className="flex items-center justify-between">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(logsPage - 1)}
                        disabled={logsPage <= 1 || loadingLogs}
                    >
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">Page {logsPage}</span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(logsPage + 1)}
                        disabled={!hasMoreLogs || loadingLogs}
                    >
                        Next
                        <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                </CardFooter>
            )}
        </Card>
    </div>
  );
}
