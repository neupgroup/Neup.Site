'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { getSiteServers, type Server } from '@/actions/servers';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Server as ServerIcon, CheckCircle, XCircle, AlertCircle, Rocket } from 'lucide-react';
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
    status: 'pending' | 'success' | 'failure' | 'loading' | 'warning';
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
        { name: 'Website Live', status: 'loading', description: 'Checking if website is reachable...' },
        { name: 'Application Exists', status: 'loading', description: 'Checking for application directory...', subActions: [{ commandId: 'install-requisites', label: 'Install Requisites' }, { commandId: 'install-packages', label: 'Install App' }] },
        { name: 'Application Built', status: 'loading', description: 'Checking for .next build folder...', action: { commandId: 'build-app', label: 'Build App' } },
        { name: 'Start App & Configure Proxy', status: 'loading', description: 'Checking PM2 process and Nginx config...', action: { commandId: 'start-app-and-configure-proxy', label: 'Restart App & Proxy' } },
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

    const runChecks = useCallback(async () => {
        if (!site) {
            setSteps(prev => prev.map(s => ({ ...s, status: 'failure', description: 'Site context not available.' })));
            setIsChecking(false);
            return;
        }

        setIsChecking(true);

        // Initialize all steps with loading state
        setSteps([
            { name: 'Website Live', status: 'loading', description: 'Checking if website is reachable...' },
            { name: 'Application Exists', status: 'loading', description: 'Checking for application directory...', subActions: [{ commandId: 'install-requisites', label: 'Install Requisites' }, { commandId: 'install-packages', label: 'Install App' }] },
            { name: 'Application Built', status: 'loading', description: 'Checking for .next build folder...', action: { commandId: 'build-app', label: 'Build App' } },
            { name: 'Start App & Configure Proxy', status: 'loading', description: 'Checking PM2 process and Nginx config...', action: { commandId: 'start-app-and-configure-proxy', label: 'Restart App & Proxy' } },
        ]);

        // STEP 1: Check if Website is Live
        if (!site.domains || site.domains.length === 0) {
            updateStep(0, 'failure', 'No domain configured for this site.');
            updateStep(1, 'failure', 'Cannot proceed without domain.');
            updateStep(2, 'failure', 'Cannot proceed without domain.');
            updateStep(3, 'failure', 'Cannot proceed without domain.');
            setIsChecking(false);
            return;
        }

        updateStep(0, 'loading', `Pinging ${site.domains[0].value}...`);
        try {
            const url = `https://${site.domains[0].value}`;
            const res = await fetch(`/api/v1/ping?url=${encodeURIComponent(url)}`, { method: 'GET', cache: 'no-cache' });
            const data = await res.json();

            if (res.ok && data.success && data.status === 200) {
                // Website is LIVE! All checks pass
                updateStep(0, 'success', `Website is live and reachable (Status 200).`);
                updateStep(1, 'success', 'Application directory exists.');
                updateStep(2, 'success', 'Application is built.');
                updateStep(3, 'success', 'Application is running and proxy is configured.');
                setIsChecking(false);
                return; // Done!
            } else {
                // Website is NOT live - continue checking
                const statusCode = data.status || 'Unknown';
                updateStep(0, 'failure', `Website is not reachable (Status ${statusCode}).`);
            }
        } catch (e) {
            updateStep(0, 'failure', 'Could not reach the website URL.');
        }

        // STEP 2: Check if Application Exists
        updateStep(1, 'loading', 'Checking for application directory...');
        const appDirCheck = await checkPathExists(server.id);

        if (!appDirCheck.exists || appDirCheck.error) {
            // Application does NOT exist - steps 3 and 4 are false
            updateStep(1, 'failure', appDirCheck.error || 'Application directory not found.');
            updateStep(2, 'failure', 'Cannot check - application directory not found.');
            updateStep(3, 'failure', 'Cannot check - application directory not found.');
            setIsChecking(false);
            return;
        }

        // Application EXISTS
        updateStep(1, 'success', `Application directory found at ${appDirCheck.resolvedPath}.`);

        // STEP 3: Check if Application is Built
        updateStep(2, 'loading', 'Checking for .next build folder...');
        const buildCheck = await checkPathExists(server.id, `${appDirCheck.resolvedPath}/.next`);

        // Update action label based on build status
        setSteps(prev => {
            const newSteps = [...prev];
            if (newSteps[2]) {
                const actionLabel = buildCheck.exists ? 'Rebuild App' : 'Build App';
                newSteps[2] = {
                    ...newSteps[2],
                    action: { commandId: 'build-app', label: actionLabel }
                };
            }
            return newSteps;
        });

        if (!buildCheck.exists) {
            // Application is NOT built - step 4 is false
            updateStep(2, 'failure', 'Application not built. The ".next" folder is missing.');
            updateStep(3, 'failure', 'Cannot check - application not built.');
            setIsChecking(false);
            return;
        }

        // Application IS built
        updateStep(2, 'success', 'Build folder found.');

        // STEP 4: Check if App is Started and Proxy is Configured
        updateStep(3, 'loading', 'Checking PM2 process and Nginx configuration...');

        const [pm2Check, nginxAvailableCheck, nginxEnabledCheck] = await Promise.all([
            getPm2Processes(server.id),
            checkPathExists(server.id, `/etc/nginx/sites-available/${site.id}.conf`),
            checkPathExists(server.id, `/etc/nginx/sites-enabled/${site.id}.conf`)
        ]);

        let pm2Ok = false;
        let nginxOk = false;
        let stepDescription = '';

        // Check PM2 status
        if (!pm2Check.success) {
            stepDescription += `Could not check PM2 processes: ${pm2Check.error}. `;
        } else {
            const siteProcess = pm2Check.processes?.find(p => p.name === site.id);
            if (!siteProcess) {
                stepDescription += `PM2 process not found. `;
            } else if (siteProcess.status !== 'online') {
                stepDescription += `PM2 process is ${siteProcess.status}. `;
            } else {
                pm2Ok = true;
                stepDescription += `PM2 process is online. `;
            }
        }

        // Check Nginx status
        if (!nginxAvailableCheck.exists) {
            stepDescription += `Nginx config file not found. `;
        } else if (!nginxEnabledCheck.exists) {
            stepDescription += `Nginx config not enabled. `;
        } else {
            nginxOk = true;
            stepDescription += 'Nginx config is enabled.';
        }

        // Final result for step 4
        if (pm2Ok && nginxOk) {
            updateStep(3, 'success', stepDescription.trim());
        } else {
            updateStep(3, 'failure', stepDescription.trim());
        }

        setIsChecking(false);
    }, [server.id, site]);

    useEffect(() => {
        runChecks();
    }, [runChecks]);

    const handleActionClick = async (clickedStepIndex: number) => {
        if (!site) return;

        const clickedStep = steps[clickedStepIndex];
        if (!clickedStep || !clickedStep.action) return;

        setIsExecutingAction(clickedStep.name);

        // In reverse order, only execute the clicked step's action
        updateStep(clickedStepIndex, 'loading', `Executing: ${clickedStep.action.label}...`);

        let result: { success: boolean; error?: string; logId?: string; finalStatus?: any } = { success: false };

        if (clickedStep.action.commandId === 'build-app') {
            // Use the specialized rebuildApplication action which updates status.json
            result = await rebuildApplication(server.id);
        } else {
            // Use generic runner
            result = await runCommand(server.id, clickedStep.action.commandId, {}, clickedStep.action.label);
        }

        // Assume success if explicit success or 'completed'
        if (result.success && (result.finalStatus === 'completed' || result.success)) {
            updateStep(clickedStepIndex, 'success', `${clickedStep.action.label} completed successfully.`);
            toast({ title: 'Step Succeeded!', description: `${clickedStep.action.label} completed successfully.` });
        } else {
            updateStep(clickedStepIndex, 'failure', `Action "${clickedStep.action.label}" failed.`);
            toast({ variant: 'destructive', title: 'Step Failed', description: `Action "${clickedStep.action.label}" failed. Check server logs.` });
            if (result.logId) {
                router.push(`/root/servers/${server.id}?log=${result.logId}`);
            }
        }

        setIsExecutingAction(null);
        setTimeout(() => runChecks(), 2000); // Re-run checks to refresh status from file
    };

    const renderStepActions = (step: DeploymentStep, index: number) => {
        const actions: JSX.Element[] = [];

        // New sequential flow: show action if step failed and all previous steps are successful
        // Step 0 (Website Live) - no actions
        // Step 1 (Application Exists) - show actions if failed
        // Step 2 (Application Built) - show actions if failed and step 1 is successful
        // Step 3 (Start App & Configure Proxy) - show actions if failed and steps 1-2 are successful

        let canShowAction = false;

        if (index === 0) {
            // Website Live - no actions available
            canShowAction = false;
        } else if (index === 1) {
            // Application Exists - show if failed
            canShowAction = step.status === 'failure';
        } else {
            // For steps 2 and 3, check if all previous steps are successful
            const allPreviousSuccessful = steps.slice(1, index).every(s => s.status === 'success');
            canShowAction = (step.status === 'failure' || (step.status === 'success' && (step.name === 'Application Built' || step.name === 'Start App & Configure Proxy'))) && allPreviousSuccessful;
        }

        if (canShowAction) {
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

    const getStatusIcon = (status: DeploymentStep['status']) => {
        switch (status) {
            case 'loading':
            case 'pending':
                return <Loader2 className="h-5 w-5 animate-spin" />;
            case 'success':
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'warning':
                return <AlertCircle className="h-5 w-5 text-amber-500" />;
            case 'failure':
            default:
                return <XCircle className="h-5 w-5 text-destructive" />;
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                        <ServerIcon className="h-5 w-5" />
                        <span className="truncate">{server.name}</span>
                    </CardTitle>
                </div>
                <CardDescription className="truncate">{server.publicIp}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {steps.map((step, index) => (
                    <div key={step.name}>
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 pt-1">
                                {getStatusIcon(step.status)}
                            </div>
                            <div className="flex-1">
                                <p className="font-medium">{step.name}</p>
                                <p className="text-sm text-muted-foreground">{step.description}</p>
                                {renderStepActions(step, index)}
                            </div>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};

export default function ApplicationStatusPage() {
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
