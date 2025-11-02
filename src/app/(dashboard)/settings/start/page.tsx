
'use client';

import { useState, useEffect, useTransition } from 'react';
import { getSiteServers, type Server } from '@/actions/servers';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, PlayCircle, Server as ServerIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { runCommand } from '@/actions/runner';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import type { ServerAllocation } from '@/schemas/server';

export default function StartApplicationPage() {
    const [servers, setServers] = useState<(Server & { allocation: ServerAllocation })[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isStarting, setIsStarting] = useState<string | null>(null);
    const { toast } = useToast();
    const router = useRouter();

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

    const handleStart = (serverId: string, serverName: string) => {
        setIsStarting(serverId);
        toast({ title: `Starting App on ${serverName}`, description: "This process may take several minutes. You will be redirected to the server logs."});
        
        runCommand(serverId, "app-start-prod").then(() => {
            router.push(`/root/servers/${serverId}`);
        }).catch((e) => {
            toast({ variant: 'destructive', title: 'Error', description: `Failed to start application: ${e.message}` });
            setIsStarting(null);
        });
    };

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
                                <Button onClick={() => handleStart(server.id, server.name)} disabled={isStarting === server.id}>
                                    {isStarting === server.id ? <Loader2 className="mr-2 animate-spin" /> : <PlayCircle className="mr-2" />}
                                    {isStarting === server.id ? 'Starting...' : 'Start Application'}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
