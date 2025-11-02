
'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { getSiteServers, type Server } from '@/actions/servers';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, PlayCircle, Server as ServerIcon, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { runCommand } from '@/actions/runner';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import type { ServerAllocation } from '@/schemas/server';
import { getServerLog, type ServerLog } from '@/actions/server-logs';
import { Progress } from '@/components/ui/progress';

interface DeploymentStatus {
    logId: string;
    status: 'pending' | 'ongoing' | 'completed' | 'failed' | 'cancelled';
    message: string;
    progress: number;
}

const getStatusFromLog = (logOutput: string): { message: string, progress: number } => {
    if (logOutput.includes('--- Deployment Complete ---')) return { message: 'Deployment Complete!', progress: 100 };
    if (logOutput.includes('--- Step 4: Setting up SSL with Certbot ---')) return { message: 'Securing server with SSL...', progress: 85 };
    if (logOutput.includes('--- Step 3: Configuring Nginx reverse proxy ---')) return { message: 'Configuring web server...', progress: 60 };
    if (logOutput.includes('--- Step 2: Starting application with PM2 ---')) return { message: 'Starting application...', progress: 40 };
    if (logOutput.includes('--- Step 1: Building application in')) return { message: 'Building application...', progress: 20 };
    if (logOutput.includes('Running pre-execution script')) return { message: 'Running pre-execution script...', progress: 10 };
    if (logOutput.includes('Connection successful. Running command...')) return { message: 'Connected to server...', progress: 5 };
    return { message: 'Preparing...', progress: 2 };
};


const DeploymentStatusCard = ({ serverId, logId }: { serverId: string, logId: string }) => {
    const [status, setStatus] = useState<DeploymentStatus>({ logId, status: 'pending', message: 'Starting...', progress: 0 });
    const router = useRouter();

    const checkLog = useCallback(async () => {
        if (!logId) return;
        
        try {
            const result = await getServerLog(logId);
            if (result.success && result.log) {
                const { message, progress } = getStatusFromLog(result.log.output);
                setStatus({
                    logId: result.log.id,
                    status: result.log.status,
                    message,
                    progress
                });
                return result.log.status; // Return status for interval control
            } else {
                 return 'failed';
            }
        } catch {
            return 'failed';
        }

    }, [logId]);

    useEffect(() => {
        if (!logId) return;

        const interval = setInterval(async () => {
            const currentStatus = await checkLog();
            if (currentStatus === 'completed' || currentStatus === 'failed' || currentStatus === 'cancelled') {
                clearInterval(interval);
            }
        }, 3000); // Poll every 3 seconds

        return () => clearInterval(interval);
    }, [logId, checkLog]);

    return (
         <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    {status.status === 'ongoing' && <Loader2 className="animate-spin text-primary" />}
                    {status.status === 'completed' && <CheckCircle className="text-green-500" />}
                    {status.status === 'failed' && <XCircle className="text-destructive" />}
                    Deployment in Progress
                </CardTitle>
                <CardDescription>Server: {serverId}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Progress value={status.progress} />
                <p className="text-sm text-muted-foreground text-center">{status.message}</p>
                {status.status === 'failed' && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Deployment Failed</AlertTitle>
                        <AlertDescription>
                            There was an error during the deployment process. Please check the server logs for more details.
                        </AlertDescription>
                    </Alert>
                )}
                 {status.status === 'completed' && (
                    <Alert variant="default" className="border-green-500/50 text-green-700 dark:text-green-400">
                        <CheckCircle className="h-4 w-4" />
                        <AlertTitle>Success!</AlertTitle>
                        <AlertDescription>
                            Your application has been successfully deployed.
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
             <CardFooter>
                <Button onClick={() => router.push(`/root/servers/${serverId}`)}>
                    View Full Logs
                </Button>
            </CardFooter>
        </Card>
    );
};


export default function StartApplicationPage() {
    const [servers, setServers] = useState<(Server & { allocation: ServerAllocation })[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deployingServer, setDeployingServer] = useState<{ serverId: string; logId: string } | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const fetchServers = async () => {
            setLoading(true);
            const result = await getSiteServers();
            if (result.success && result.servers) {
                setServers(result.servers);
            } else {
                setError(result.error || 'Failed to fetch allocated servers.');
            }
            setLoading(false);
        };
        fetchServers();
    }, []);

    const handleStart = async (serverId: string, serverName: string) => {
        setDeployingServer({ serverId, logId: '' }); // Immediately switch view
        toast({ title: `Starting App on ${serverName}`, description: "The deployment process has begun."});
        
        try {
            const result = await runCommand(serverId, "app-start-prod");
            if (result.success && result.logId) {
                setDeployingServer({ serverId, logId: result.logId });
            } else {
                throw new Error(result.error || 'Failed to initiate command.');
            }
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: `Failed to start application: ${e.message}` });
            setDeployingServer(null); // Revert UI on failure to start
        }
    };

    if (deployingServer) {
        return <DeploymentStatusCard serverId={deployingServer.serverId} logId={deployingServer.logId} />;
    }

    return (
        <div className="w-full max-w-4xl mx-auto">
            <header className="mb-8">
                <h1 className="font-headline text-3xl font-bold tracking-tight">Start Application</h1>
                <p className="text-muted-foreground">Choose a server to deploy and start your application on.</p>
            </header>

            {loading ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-40 w-full" />
                 </div>
            ) : error ? (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            ) : servers.length === 0 ? (
                 <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
                    <ServerIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">No Allocated Servers Found</h3>
                    <p>You need to allocate a server to this site before you can start an application.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {servers.map(server => (
                        <Card key={server.id}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ServerIcon className="h-5 w-5"/>
                                    {server.name}
                                </CardTitle>
                                <CardDescription>{server.publicIp}</CardDescription>
                            </CardHeader>
                            <CardFooter>
                                <Button onClick={() => handleStart(server.id, server.name)}>
                                    <PlayCircle className="mr-2" />
                                    Start Application
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
