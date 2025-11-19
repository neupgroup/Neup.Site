
'use client';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Terminal, AlertCircle, ChevronLeft, ChevronRight, Loader2, ChevronDown, RefreshCw } from 'lucide-react';
import { getServerLogs } from '@/actions/server-logs';
import type { ServerLog } from '@/schemas/server';
import { formatDistanceToNow } from 'date-fns';
import { logErrorToFirestore } from '@/lib/logging';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const ServerLogs = ({ serverId }: { serverId: string }) => {
    const [logs, setLogs] = useState<ServerLog[]>([]);
    const [logsPage, setLogsPage] = useState(1);
    const [hasMoreLogs, setHasMoreLogs] = useState(false);
    const [loadingLogs, setLoadingLogs] = useState(true);
    const [logsError, setLogsError] = useState<string | null>(null);

    const fetchLogs = async (page = 1) => {
        setLoadingLogs(true);
        setLogsError(null);
        const result = await getServerLogs({ serverId, page, pageSize: 5 });

        if (result.success && result.logs) {
            setLogs(result.logs);
            setHasMoreLogs(result.hasMore || false);
        } else {
            const errorMessage = result.error || 'Failed to load logs.';
            setLogsError(errorMessage);
            logErrorToFirestore({
                message: `Client-side error in fetchLogs for serverId: ${serverId}. Error: ${errorMessage}`,
                stack: new Error().stack,
                source: 'ServerLogs.fetchLogs',
            });
        }
        setLoadingLogs(false);
    };

    useEffect(() => {
        fetchLogs(logsPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serverId, logsPage]);

    useEffect(() => {
        const hasOngoingLog = logs.some(log => log.status === 'ongoing' || log.status === 'pending');
        let interval: NodeJS.Timeout | null = null;
        if (hasOngoingLog) {
            interval = setInterval(() => fetchLogs(logsPage), 3000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [logs, serverId, logsPage]);

    const getStatusVariant = (status: ServerLog['status']): 'default' | 'destructive' | 'secondary' => {
        switch (status) {
            case 'completed':
                return 'default';
            case 'failed':
            case 'cancelled':
                return 'destructive';
            default:
                return 'secondary';
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Server Logs</CardTitle>
                        <CardDescription>History of all commands run on this server.</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => fetchLogs(logsPage)} disabled={loadingLogs}>
                    {loadingLogs ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    Reload
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {loadingLogs && logs.length === 0 ? (
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
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
                            <AccordionItem value={log.id} key={log.id} className="border rounded-md px-4 data-[state=open]:border-primary">
                                <AccordionTrigger className="hover:no-underline text-left py-3">
                                    <div className='w-full space-y-2'>
                                        <div className="flex justify-between items-center w-full">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Badge variant={getStatusVariant(log.status)} className={cn('capitalize', log.status === 'completed' && 'bg-green-600')}>
                                                    {log.status === 'ongoing' && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                                                    {log.status}
                                                </Badge>
                                                <span className="text-muted-foreground">{log.initiatedAt ? formatDistanceToNow(new Date(log.initiatedAt), { addSuffix: true }) : 'Just now'}</span>
                                                <span className="text-muted-foreground">by {log.initiatedBy}</span>
                                            </div>
                                            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 text-muted-foreground" />
                                        </div>
                                        <p className="text-sm font-semibold text-left truncate pr-8">
                                            {log.commandName || 'Undefined Command'}
                                        </p>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="overflow-hidden data-[state=open]:animate-[accordion-down_300ms_ease-out] data-[state=closed]:animate-[accordion-up_300ms_ease-out]">
                                    <div className="space-y-4 pt-2">
                                        <div>
                                            <h4 className="font-semibold text-sm">Command</h4>
                                            <pre className="text-xs bg-muted p-3 mt-1 rounded-md whitespace-pre-wrap break-all font-mono w-full text-left">
                                                {log.command || 'No command specified.'}
                                            </pre>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-sm">Output:</h4>
                                            <pre className="text-xs bg-black text-white p-3 mt-1 rounded-md whitespace-pre-wrap break-all font-mono">
                                                {log.output || 'No output from server.'}
                                            </pre>
                                        </div>
                                        {log.completedAt && (
                                            <p className="text-xs text-muted-foreground mt-2 text-right">Completed: {new Date(log.completedAt).toLocaleString()}</p>
                                        )}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                )}
            </CardContent>
            {(logsPage > 1 || hasMoreLogs) && (
                <CardFooter className="flex items-center justify-between pt-4">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setLogsPage(prev => Math.max(1, prev - 1))}
                            disabled={logsPage <= 1 || loadingLogs}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setLogsPage(prev => Math.min(5, prev + 1))}
                            disabled={!hasMoreLogs || loadingLogs}
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Page {logsPage}
                    </div>
                </CardFooter>
            )}
        </Card>
    );
};

ServerLogs.Skeleton = function ServerLogsSkeleton() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Server Logs</CardTitle>
                <CardDescription>History of all commands run on this server.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
                </div>
            </CardContent>
        </Card>
    )
}

export default ServerLogs;
