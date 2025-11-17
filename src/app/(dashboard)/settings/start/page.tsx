
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
import type { Site } from '@/schemas/site';
import { getPm2Processes } from '@/actions/server/management/get-pm2-processes';
import { checkPathExists, rebuildApplication } from '@/actions/server/management/check-build';
import { useProfile } from '@/context/ProfileContext';

interface DeploymentStep {
    name: string;
    status: 'pending' | 'success' | 'failure' | 'loading';
    description: string;
    action?: { commandId: string; label: string; params?: Record<string, any> };
}

const DeploymentStatusChecker = ({ server, allocation, site }: { server: Server, allocation: ServerAllocation, site: Site | null }) => {
    const router = useRouter();
    const { toast } = useToast();
    const [isChecking, setIsChecking] = useState(true);
    const [isExecutingAction, setIsExecutingAction] = useState<string | null>(null);
    const [steps, setSteps] = useState<DeploymentStep[]>([
        { name: 'Application Exists', status: 'pending', description: 'Checking for application directory...' },
        { name: 'Application Built', status: 'pending', description: 'Checking for .next build folder...' },
        { name: 'Application Running', status: 'pending', description: 'Checking for PM2 process...' },
        { name: 'Website Live', status: 'pending', description: 'Pinging public domain...' },
    ]);
    
    const updateStep = (name: string, status: DeploymentStep['status'], description: string, action?: DeploymentStep['action']) => {
        setSteps(prev => prev.map(step => step.name === name ? { ...step, status, description, action } : step));
    };

    const failSubsequentSteps = (fromStepIndex: number, description: string = 'Skipped because a previous step failed.') => {
        setSteps(prev => prev.map((step, index) => {
            if (index >= fromStepIndex) {
                return { ...step, status: 'failure', description };
            }
            return step;
        }));
    };

    const runChecks = useCallback(async () => {
        if (!site) {
            setSteps(prev => prev.map(s => ({...s, status: 'failure', description: 'Site context not available.'})));
            return;
        }

        setIsChecking(true);
        setSteps(prev => prev.map(s => ({...s, status: 'pending', description: 'Checking...', action: undefined})));

        // Step 1: Check Application Directory
        const appDirCheck = await checkPathExists(server.id);
        if (!appDirCheck.exists) {
            updateStep('Application Exists', 'failure', `Directory not found at ${appDirCheck.resolvedPath || 'the expected path'}.`);
            failSubsequentSteps(1);
            setIsChecking(false);
            return;
        }
        updateStep('Application Exists', 'success', `Directory found at ${appDirCheck.resolvedPath}.`);

        // Step 2: Check Build Status
        const buildCheck = await checkPathExists(server.id, `${appDirCheck.resolvedPath}/.next`);
        if (!buildCheck.exists) {
            updateStep('Application Built', 'failure', 'Application not built. The ".next" folder is missing.', { commandId: 'build-app', label: 'Build App' });
            failSubsequentSteps(2, 'Skipped because application is not built.');
            setIsChecking(false);
            return;
        }
        updateStep('Application Built', 'success', 'Build folder found.');
        
        // Step 3: Check PM2 Status
        const pm2Check = await getPm2Processes(server.id);
        const expectedProcessName = `${site.id}.${allocation.port}.production`;
        const isRunning = pm2Check.success && pm2Check.processes?.some(p => p.name === expectedProcessName && p.status === 'online');
        if (!isRunning) {
            updateStep('Application Running', 'failure', `Process "${expectedProcessName}" not found or not online.`, { commandId: 'run-app', label: 'Run App' });
            failSubsequentSteps(3, 'Skipped because application is not running.');
            setIsChecking(false);
            return;
        }
        updateStep('Application Running', 'success', `Process "${expectedProcessName}" is online.`);

        // Step 4: Check Live URL Status
        if (site.domains && site.domains.length > 0) {
            try {
                const url = `https://${site.domains[0].value}`;
                const res = await fetch(`/api/v1/ping?url=${encodeURIComponent(url)}`, { method: 'GET', cache: 'no-cache' });
                const data = await res.json();
                if (res.ok && data.success) {
                    updateStep('Website Live', 'success', `URL is reachable with status ${data.status}.`);
                } else {
                    updateStep('Website Live', 'failure', `URL returned status ${data.status || 'Error'}. Nginx may not be configured correctly.`, { commandId: 'make-config', label: 'Make Config' });
                }
            } catch (e) {
                updateStep('Website Live', 'failure', 'Could not reach the website URL.', { commandId: 'make-config', label: 'Make Config' });
            }
        } else {
             updateStep('Website Live', 'failure', 'No domain configured for this site.');
        }

        setIsChecking(false);
    }, [server.id, site, allocation.port]);

    useEffect(() => {
        runChecks();
    }, [runChecks]);

    const handleActionClick = async (commandId: string, label: string) => {
        if (!site) return;
        setIsExecutingAction(commandId);
        toast({ title: `Executing: ${label}`, description: "This may take a moment..." });
        const result = await runCommand(server.id, commandId);
         if (result && result.success && result.logId) {
            toast({ title: 'Action Sent', description: `Check server logs for progress.` });
            router.push(`/root/servers/${result.serverId}?log=${result.logId}`);
        } else {
            toast({ variant: 'destructive', title: 'Action Failed', description: result?.error || 'An unknown error occurred.' });
        }
        setIsExecutingAction(null);
        runChecks(); // Re-run checks after action
    };

    const handleFullRestart = async () => {
        setIsExecutingAction('full-restart');
        toast({ title: `Starting App on ${server.name}`, description: "This may take up to 5 minutes." });
        
        try {
            const result = await runCommand(server.id, "app-start-prod");
            if (result && result.success && result.logId) {
                router.push(`/root/servers/${result.serverId}`);
            } else {
                throw new Error(result?.error || 'Failed to initiate command.');
            }
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: `Failed to start application: ${e.message}` });
        } finally {
            setIsExecutingAction(null);
        }
    };

    const renderStepActions = (step: DeploymentStep) => {
        if (step.status !== 'failure') return null;

        const actions: JSX.Element[] = [];

        if (step.name === 'Application Built') {
             actions.push(<Button key="install-req" size="sm" variant="secondary" onClick={() => handleActionClick('install-requisites', 'Install Requisites')} disabled={!!isExecutingAction}>{isExecutingAction === 'install-requisites' ? <Loader2 className="animate-spin" /> : 'Install Requisites'}</Button>);
            actions.push(<Button key="install-pkg" size="sm" variant="secondary" onClick={() => handleActionClick('install-packages', 'Install Packages')} disabled={!!isExecutingAction}>{isExecutingAction === 'install-packages' ? <Loader2 className="animate-spin" /> : 'Install App'}</Button>);
        }
        if (step.action) {
            actions.push(<Button key={step.action.commandId} size="sm" variant="secondary" onClick={() => handleActionClick(step.action!.commandId, step.action!.label)} disabled={!!isExecutingAction}>{isExecutingAction === step.action.commandId ? <Loader2 className="animate-spin" /> : step.action.label}</Button>);
        }
        if (step.name === 'Application Running') {
             actions.push(<Button key="run-perm" size="sm" variant="secondary" onClick={() => handleActionClick('run-permanently', 'Run Permanently')} disabled={!!isExecutingAction}>{isExecutingAction === 'run-permanently' ? <Loader2 className="animate-spin" /> : 'Run Permanently'}</Button>);
        }

        return <div className="mt-2 flex flex-wrap gap-2">{actions}</div>
    }

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
                    <div key={step.name}>
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 pt-1">
                                {step.status === 'loading' || (isChecking && step.status === 'pending') ? <Loader2 className="h-5 w-5 animate-spin" /> : 
                                step.status === 'success' ? <CheckCircle className="h-5 w-5 text-green-500" /> : 
                                <XCircle className="h-5 w-5 text-destructive" />}
                            </div>
                            <div>
                                <p className="font-medium">{step.name}</p>
                                <p className="text-sm text-muted-foreground">{step.description}</p>
                                {renderStepActions(step)}
                            </div>
                        </div>
                    </div>
                ))}
            </CardContent>
            <CardFooter className="gap-2">
                <Button onClick={runChecks} disabled={isChecking || !!isExecutingAction} variant="outline">
                    <RefreshCw className="mr-2"/>
                    Check Status
                </Button>
                <Button onClick={handleFullRestart} disabled={isChecking || !!isExecutingAction}>
                    {isExecutingAction === 'full-restart' ? <Loader2 className="mr-2 animate-spin"/> : <Rocket className="mr-2" />}
                    {isExecutingAction === 'full-restart' ? 'Restarting...' : 'Restart Application'}
                </Button>
            </CardFooter>
        </Card>
    );
};

export default function StartApplicationPage() {
    const [servers, setServers] = useState<(Server & { allocation: ServerAllocation })[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { site } = useProfile();

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
                 <div className="space-y-6">
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
                        <DeploymentStatusChecker key={server.id} server={server} allocation={server.allocation} site={site} />
                    ))}
                </div>
            )}
        </div>
    );
}

