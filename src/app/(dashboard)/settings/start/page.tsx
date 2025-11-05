
'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSiteServers, type Server } from '@/actions/servers';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Server as ServerIcon, CheckCircle, XCircle, RefreshCw, AlertCircle, Rocket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { runCommand } from '@/actions/runner';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import type { ServerAllocation } from '@/schemas/server';
import { getPm2Processes, type ProcessManagerInfo } from '@/actions/server/management/get-pm2-processes';
import { checkPathExists, rebuildApplication } from '@/actions/server/management/check-build';
import { useProfile } from '@/context/ProfileContext';

interface DeploymentStep {
    name: string;
    status: 'pending' | 'success' | 'failure' | 'loading';
    description: string;
}

const DeploymentStatusChecker = ({ server, allocation }: { server: Server, allocation: ServerAllocation }) => {
    const { site } = useProfile();
    const router = useRouter();
    const { toast } = useToast();
    const [isChecking, setIsChecking] = useState(true);
    const [isRebuilding, setIsRebuilding] = useState(false);
    const [isRestarting, setIsRestarting] = useState(false);
    const [steps, setSteps] = useState<DeploymentStep[]>([
        { name: 'Application Exists', status: 'pending', description: 'Checking for application directory...' },
        { name: 'Application Built', status: 'pending', description: 'Checking for .next build folder...' },
        { name: 'Application Running', status: 'pending', description: 'Checking for PM2 process...' },
        { name: 'Website Live', status: 'pending', description: 'Pinging public domain...' },
    ]);

    const runChecks = useCallback(async () => {
        setIsChecking(true);
        const resolvedAppPath = server.appPath?.replace(/\{\{universal\.site_id\}\}/g, site?.id || '') || '';
        
        // Check Application Directory
        const appDirCheck = await checkPathExists(server.id, resolvedAppPath);
        updateStep('Application Exists', appDirCheck.exists ? 'success' : 'failure', appDirCheck.exists ? `Directory found at ${resolvedAppPath}.` : 'Application directory not found.');

        // Check Build Status
        const buildCheck = await checkPathExists(server.id, `${resolvedAppPath}/.next`);
        updateStep('Application Built', buildCheck.exists ? 'success' : 'failure', buildCheck.exists ? 'Build folder found.' : 'Application not built on server.');
        
        // Check PM2 Status
        const pm2Check = await getPm2Processes(server.id);
        const expectedProcessName = `${site?.id}.${allocation.port}.production`;
        const isRunning = pm2Check.success && pm2Check.processes?.some(p => p.name === expectedProcessName && p.status === 'online');
        updateStep('Application Running', isRunning ? 'success' : 'failure', isRunning ? `Process "${expectedProcessName}" is online.` : 'Application process not found or not running.');

        // Check Live URL Status
        if (site?.domains && site.domains.length > 0) {
            try {
                const url = `https://${site.domains[0].value}`;
                const res = await fetch(url, { method: 'HEAD', cache: 'no-cache' });
                updateStep('Website Live', res.ok ? 'success' : 'failure', res.ok ? `URL is reachable with status ${res.status}.` : `URL returned status ${res.status}.`);
            } catch (e) {
                updateStep('Website Live', 'failure', 'Could not reach the website URL.');
            }
        } else {
             updateStep('Website Live', 'failure', 'No domain configured for this site.');
        }

        setIsChecking(false);
    }, [server.id, server.appPath, site?.id, site?.domains, allocation.port]);

    useEffect(() => {
        runChecks();
    }, [runChecks]);

    const updateStep = (name: string, status: DeploymentStep['status'], description: string) => {
        setSteps(prev => prev.map(step => step.name === name ? { ...step, status, description } : step));
    };

    const handleRebuild = async () => {
        setIsRebuilding(true);
        toast({ title: "Rebuild Initiated", description: "This may take a few minutes."});
        const resolvedAppPath = server.appPath?.replace(/\{\{universal\.site_id\}\}/g, site?.id || '') || '';
        const result = await rebuildApplication(server.id, resolvedAppPath);
        if (result.success) {
            toast({ title: "Rebuild Successful" });
        } else {
            toast({ variant: 'destructive', title: "Rebuild Failed", description: result.error });
        }
        setIsRebuilding(false);
        await runChecks();
    }
    
    const handleRestart = async () => {
        setIsRestarting(true);
        toast({ title: `Starting App on ${server.name}`, description: "This may take up to 5 minutes." });
        
        try {
            const result = await runCommand(server.id, "app-start-prod");
            if (result.success && result.logId) {
                router.push(`/root/servers/${result.serverId}`);
            } else {
                throw new Error(result.error || 'Failed to initiate command.');
            }
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: `Failed to start application: ${e.message}` });
        } finally {
            setIsRestarting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ServerIcon className="h-5 w-5"/>
                    {server.name}
                </CardTitle>
                <CardDescription>{server.publicIp}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {steps.map(step => (
                    <div key={step.name} className="flex items-start gap-4">
                        <div className="flex-shrink-0 pt-1">
                            {step.status === 'loading' || (isChecking && step.status === 'pending') ? <Loader2 className="h-5 w-5 animate-spin" /> : 
                             step.status === 'success' ? <CheckCircle className="h-5 w-5 text-green-500" /> : 
                             <XCircle className="h-5 w-5 text-destructive" />}
                        </div>
                        <div>
                            <p className="font-medium">{step.name}</p>
                            <p className="text-sm text-muted-foreground">{step.description}</p>
                        </div>
                    </div>
                ))}
            </CardContent>
            <CardFooter className="gap-2">
                <Button onClick={runChecks} disabled={isChecking || isRebuilding || isRestarting} variant="outline">
                    <RefreshCw className="mr-2"/>
                    Check Status
                </Button>
                 <Button onClick={handleRebuild} disabled={isChecking || isRebuilding || isRestarting} variant="secondary">
                    {isRebuilding ? <Loader2 className="mr-2 animate-spin"/> : <RefreshCw className="mr-2" />}
                    {isRebuilding ? 'Rebuilding...' : 'Rebuild App'}
                </Button>
                <Button onClick={handleRestart} disabled={isChecking || isRebuilding || isRestarting}>
                    {isRestarting ? <Loader2 className="mr-2 animate-spin"/> : <Rocket className="mr-2" />}
                    {isRestarting ? 'Restarting...' : 'Restart Application'}
                </Button>
            </CardFooter>
        </Card>
    );
};

export default function StartApplicationPage() {
    const [servers, setServers] = useState<(Server & { allocation: ServerAllocation })[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    return (
        <div className="w-full max-w-4xl mx-auto">
            <header className="mb-8">
                <h1 className="font-headline text-3xl font-bold tracking-tight">Application Status</h1>
                <p className="text-muted-foreground">Check the deployment status of your application on its allocated servers.</p>
            </header>

            {loading ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
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
                <div className="space-y-6">
                    {servers.map(server => (
                        <DeploymentStatusChecker key={server.id} server={server} allocation={server.allocation} />
                    ))}
                </div>
            )}
        </div>
    );
}
