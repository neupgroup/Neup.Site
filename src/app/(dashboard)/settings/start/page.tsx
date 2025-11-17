
'use client';

import { useState, useEffect, useCallback, use } from 'react';
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
import { checkPathExists } from '@/actions/server/management/check-build';
import { useProfile } from '@/context/ProfileContext';

interface DeploymentStep {
    name: string;
    status: 'pending' | 'success' | 'failure' | 'loading';
    description: string;
    action?: { commandId: string; label: string; };
    subActions?: { commandId: string; label: string; }[];
}

const DeploymentStatusChecker = ({ server, allocation, site }: { server: Server, allocation: ServerAllocation, site: Site | null }) => {
    const router = useRouter();
    const { toast } = useToast();
    const [isChecking, setIsChecking] = useState(true);
    const [isExecutingAction, setIsExecutingAction] = useState<string | null>(null);
    const [steps, setSteps] = useState<DeploymentStep[]>([
        { name: 'Application Exists', status: 'pending', description: 'Checking for application directory...', subActions: [{ commandId: 'install-requisites', label: 'Install Requisites'}, { commandId: 'install-packages', label: 'Install App'}] },
        { name: 'Application Built', status: 'pending', description: 'Checking for .next build folder...', action: { commandId: 'build-app', label: 'Build App' } },
        { name: 'Application Running', status: 'pending', description: 'Checking for PM2 process...', action: { commandId: 'run-app', label: 'Run App' } },
        { name: 'Nginx Config', status: 'pending', description: 'Checking for Nginx configuration...', action: { commandId: 'make-config', label: 'Make Config' } },
        { name: 'Website Live', status: 'pending', description: 'Pinging public domain...' },
    ]);
    
    const updateStep = (index: number, status: DeploymentStep['status'], description: string) => {
        setSteps(prev => {
            const newSteps = [...prev];
            if (newSteps[index]) {
                newSteps[index] = { ...newSteps[index], status, description };
            }
            return newSteps;
        });
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
        const currentSteps = [...steps].map(s => ({ ...s, status: 'pending', description: 'Checking...' } as DeploymentStep));
        setSteps(currentSteps);


        // Step 0: Check Application Directory
        currentSteps[0].status = 'loading';
        currentSteps[0].description = 'Checking for application directory...';
        setSteps([...currentSteps]);
        const appDirCheck = await checkPathExists(server.id);
        if (!appDirCheck.exists || appDirCheck.error) {
            currentSteps[0].status = 'failure';
            currentSteps[0].description = appDirCheck.error || `Directory not found at ${appDirCheck.resolvedPath || 'the expected path'}.`;
            setSteps([...currentSteps]);
            failSubsequentSteps(1);
            setIsChecking(false);
            return;
        }
        currentSteps[0].status = 'success';
        currentSteps[0].description = `Directory found at ${appDirCheck.resolvedPath}.`;
        setSteps([...currentSteps]);


        // Step 1: Check Build Status
        currentSteps[1].status = 'loading';
        currentSteps[1].description = 'Checking for .next build folder...';
        setSteps([...currentSteps]);
        const buildCheck = await checkPathExists(server.id, `${appDirCheck.resolvedPath}/.next`);
        if (!buildCheck.exists) {
            currentSteps[1].status = 'failure';
            currentSteps[1].description = 'Application not built. The ".next" folder is missing.';
            setSteps([...currentSteps]);
            failSubsequentSteps(2, 'Skipped because application is not built.');
            setIsChecking(false);
            return;
        }
        currentSteps[1].status = 'success';
        currentSteps[1].description = 'Build folder found.';
        setSteps([...currentSteps]);

        
        // Step 2: Check PM2 Status
        currentSteps[2].status = 'loading';
        currentSteps[2].description = 'Checking for PM2 process...';
        setSteps([...currentSteps]);
        const pm2Check = await getPm2Processes(server.id);
        if (!pm2Check.success) {
            currentSteps[2].status = 'failure';
            currentSteps[2].description = `Could not check PM2 processes: ${pm2Check.error}`;
            setSteps([...currentSteps]);
            failSubsequentSteps(3);
            setIsChecking(false);
            return;
        }

        const siteProcess = pm2Check.processes?.find(p => p.name.startsWith(`${site.id}.`));

        if (!siteProcess) {
            currentSteps[2].status = 'failure';
            currentSteps[2].description = `Process not found or not online.`;
            setSteps([...currentSteps]);
            failSubsequentSteps(3);
            setIsChecking(false);
            return;
        }

        if (siteProcess.status !== 'online') {
            currentSteps[2].status = 'failure';
            currentSteps[2].description = `Process found in a crashed/stopped state.`;
            setSteps([...currentSteps]);
            failSubsequentSteps(3);
            setIsChecking(false);
            return;
        }

        currentSteps[2].status = 'success';
        currentSteps[2].description = `Process "${siteProcess.name}" is online.`;
        setSteps([...currentSteps]);


        // Step 3: Check Nginx Config
        currentSteps[3].status = 'loading';
        currentSteps[3].description = 'Checking Nginx configuration...';
        setSteps([...currentSteps]);
        const nginxConfigPath = `/etc/nginx/sites-enabled/${site.id}.conf`;
        const nginxCheck = await checkPathExists(server.id, nginxConfigPath);
        if (!nginxCheck.exists) {
             currentSteps[3].status = 'failure';
             currentSteps[3].description = 'Nginx config file not found.';
             setSteps([...currentSteps]);
             failSubsequentSteps(4, 'Skipped because Nginx is not configured.');
             setIsChecking(false);
             return;
        }
        currentSteps[3].status = 'success';
        currentSteps[3].description = 'Nginx config file found.';
        setSteps([...currentSteps]);


        // Step 4: Check Live URL Status
        if (site.domains && site.domains.length > 0) {
            currentSteps[4].status = 'loading';
            currentSteps[4].description = `Pinging ${site.domains[0].value}...`;
            setSteps([...currentSteps]);
            try {
                const url = `https://${site.domains[0].value}`;
                const res = await fetch(`/api/v1/ping?url=${encodeURIComponent(url)}`, { method: 'GET', cache: 'no-cache' });
                const data = await res.json();
                if (res.ok && data.success) {
                    currentSteps[4].status = 'success';
                    currentSteps[4].description = `URL is reachable with status ${data.status}.`;
                } else {
                    currentSteps[4].status = 'failure';
                    currentSteps[4].description = `URL returned status ${data.status || 'Error'}. Nginx may not be configured correctly.`;
                }
            } catch (e) {
                currentSteps[4].status = 'failure';
                currentSteps[4].description = 'Could not reach the website URL.';
            }
        } else {
             currentSteps[4].status = 'failure';
             currentSteps[4].description = 'No domain configured for this site.';
        }
        setSteps([...currentSteps]);

        setIsChecking(false);
    }, [server.id, site]);

    useEffect(() => {
        runChecks();
    }, [runChecks]);

    const handleActionClick = async (clickedStepIndex: number) => {
        if (!site) return;
        
        const clickedStep = steps[clickedStepIndex];
        if (!clickedStep) return;

        setIsExecutingAction(clickedStep.name);

        const actionQueue = steps
            .slice(clickedStepIndex)
            .map(s => s.action)
            .filter(Boolean) as { commandId: string; label: string; }[];
            
        if (actionQueue.length === 0) {
            setIsExecutingAction(null);
            return;
        };

        for (let i = 0; i < actionQueue.length; i++) {
            const action = actionQueue[i];
            const currentStepIndex = clickedStepIndex + i;
            
            updateStep(currentStepIndex, 'loading', `Executing: ${action.label}...`);
            
            const result = await runCommand(server.id, action.commandId, {
                'universal.server_reservedPort': allocation.port,
                'universal.site_domain': site.domains?.[0]?.value || ''
            }, action.label);
            
            if (result.success && result.finalStatus === 'completed') {
                updateStep(currentStepIndex, 'success', `${action.label} completed successfully.`);
                toast({ title: 'Step Succeeded!', description: `${action.label} completed successfully.`});
            } else {
                 updateStep(currentStepIndex, 'failure', `Action "${action.label}" failed.`);
                toast({ variant: 'destructive', title: 'Step Failed', description: `Action "${action.label}" failed. Check server logs.` });
                if (result.logId) {
                    router.push(`/root/servers/${result.serverId}?log=${result.logId}`);
                }
                setIsExecutingAction(null);
                failSubsequentSteps(currentStepIndex + 1, 'Skipped because a previous step failed.');
                return;
            }
        }
        setIsExecutingAction(null);
        setTimeout(() => runChecks(), 2000); // Re-run checks after all actions with a small delay
    };

    const handleRebuild = async () => {
        handleActionClick(1);
    };

    const handleFullRestart = async () => {
        setIsExecutingAction('app-start-prod');
        toast({ title: `Starting App on ${server.name}`, description: "This may take up to 5 minutes." });
        
        try {
            const result = await runCommand(server.id, "app-start-prod", {
                'universal.server_reservedPort': allocation.port,
                 'universal.site_domain': site?.domains?.[0]?.value || ''
            }, "Start Application (Production)");
            if (result && result.success && result.logId) {
                 setTimeout(() => {
                    router.push(`/root/servers/${result.serverId}`);
                    runChecks();
                }, 3000);
            } else {
                throw new Error(result?.error || 'Failed to initiate command.');
            }
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: `Failed to start application: ${e.message}` });
        } finally {
            setIsExecutingAction(null);
        }
    };
    
    const renderStepActions = (step: DeploymentStep, index: number) => {
        const actions: JSX.Element[] = [];

        if (index === 1 && steps[0].status === 'success' && step.status !== 'pending') { // Always show rebuild for step 2 if not pending
             actions.push(<Button key="rebuild-app" size="sm" variant="link" onClick={handleRebuild} disabled={!!isExecutingAction}>{isExecutingAction === 'Application Built' ? <Loader2 className="animate-spin" /> : 'Rebuild App'}</Button>);
        }

        // Only show fix actions if previous steps succeeded and current one failed
        const canShowFixAction = (index === 0 || (index > 0 && steps[index-1].status === 'success')) && step.status === 'failure';
        
        if (canShowFixAction) {
            if (step.action) {
                 actions.push(<Button key={step.action.commandId} size="sm" variant="link" onClick={() => handleActionClick(index)} disabled={!!isExecutingAction}>{isExecutingAction === step.name ? <Loader2 className="animate-spin" /> : step.action.label}</Button>);
            }
            if (step.subActions) {
                step.subActions.forEach(subAction => {
                    actions.push(<Button key={subAction.commandId} size="sm" variant="link" onClick={() => runCommand(server.id, subAction.commandId, {})} disabled={!!isExecutingAction}>{isExecutingAction === step.name ? <Loader2 className="animate-spin" /> : subAction.label}</Button>);
                });
            }
        }
        
        if (actions.length === 0) return null;

        return <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">{actions}</div>
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
                {steps.map((step, index) => (
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
                                {renderStepActions(step, index)}
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
                    {isExecutingAction === 'app-start-prod' ? <Loader2 className="mr-2 animate-spin"/> : <Rocket className="mr-2" />}
                    {isExecutingAction === 'app-start-prod' ? 'Restarting...' : 'Restart Application'}
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



    
