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
import { getAppStatus, updateAppStatus, type AppStatus } from '@/actions/server/management/app-status';

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
        { name: 'Website Live', status: 'pending', description: 'Pinging public domain...' },
        { name: 'Start App & Configure Proxy', status: 'pending', description: 'Checking PM2 process and Nginx config...', action: { commandId: 'start-app-and-configure-proxy', label: 'Restart App & Proxy' } },
        { name: 'Application Built', status: 'pending', description: 'Checking for .next build folder...', action: { commandId: 'build-app', label: 'Rebuild App' } },
        { name: 'Application Exists', status: 'pending', description: 'Checking for application directory...', subActions: [{ commandId: 'install-requisites', label: 'Install Requisites' }, { commandId: 'install-packages', label: 'Install App' }] },
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

    const markStepsAsSuccess = (fromIndex: number, toIndex: number, description: string = 'Implicitly successful.') => {
        setSteps(prev => prev.map((step, index) => {
            if (index >= fromIndex && index <= toIndex) {
                return { ...step, status: 'success', description };
            }
            return step;
        }));
    };

    const runChecks = useCallback(async () => {
        if (!site) {
            setSteps(prev => prev.map(s => ({ ...s, status: 'failure', description: 'Site context not available.' })));
            setIsChecking(false);
            return;
        }

        setIsChecking(true);
        const initialSteps: DeploymentStep[] = [
            { name: 'Website Live', status: 'pending', description: 'Pinging public domain...' },
            { name: 'Start App & Configure Proxy', status: 'pending', description: 'Checking PM2 process and Nginx config...', action: { commandId: 'start-app-and-configure-proxy', label: 'Restart App & Proxy' } },
            { name: 'Application Built', status: 'pending', description: 'Checking for .next build folder...', action: { commandId: 'build-app', label: 'Rebuild App' } },
            { name: 'Application Exists', status: 'pending', description: 'Checking for application directory...', subActions: [{ commandId: 'install-requisites', label: 'Install Requisites' }, { commandId: 'install-packages', label: 'Install App' }] },
        ];

        // 1. Try to read from status file
        const statusFile = await getAppStatus(server.id);
        if (statusFile.success && statusFile.status) {
            const s = statusFile.status;

            // Map status file to steps (in reverse order)
            const mappedSteps = [...initialSteps];

            // Step 0 (Website Live)
            if (s.websiteLive.status === 'success') {
                mappedSteps[0] = { ...mappedSteps[0], status: 'success', description: s.websiteLive.description || 'Website is live.' };
                // If website is live, all previous steps are implicitly successful
                mappedSteps[1] = { ...mappedSteps[1], status: 'success', description: 'Application is running and Nginx is configured.' };
                mappedSteps[2] = { ...mappedSteps[2], status: 'success', description: 'Build folder found.', action: { commandId: 'build-app', label: 'Rebuild App' } };
                mappedSteps[3] = { ...mappedSteps[3], status: 'success', description: 'Application directory found.' };
            } else if (s.websiteLive.status === 'failure' || s.websiteLive.status === 'warning') {
                mappedSteps[0] = { ...mappedSteps[0], status: s.websiteLive.status, description: s.websiteLive.description || 'Website unreachable.' };

                // Need to check previous steps
                // Step 1 (Proxy)
                if (s.proxyConfigured.status === 'success') {
                    mappedSteps[1] = { ...mappedSteps[1], status: 'success', description: s.proxyConfigured.description || 'Proxy configured.' };
                    // If proxy is configured, previous steps are successful
                    mappedSteps[2] = { ...mappedSteps[2], status: 'success', description: 'Build folder found.', action: { commandId: 'build-app', label: 'Rebuild App' } };
                    mappedSteps[3] = { ...mappedSteps[3], status: 'success', description: 'Application directory found.' };
                } else if (s.proxyConfigured.status === 'failure') {
                    mappedSteps[1] = { ...mappedSteps[1], status: 'failure', description: s.proxyConfigured.description || 'Proxy configuration failed.' };

                    // Check build status
                    const isBuilt = s.applicationBuilt.status === 'built' || s.applicationBuilt.status === 'success';
                    const isBuilding = s.applicationBuilt.status === 'building' || s.applicationBuilt.status === 'loading';
                    const isFailed = s.applicationBuilt.status === 'failure' || s.applicationBuilt.status === 'notBuilt';

                    let isStuck = false;
                    if (isBuilding && s.applicationBuilt.recordedAt) {
                        const recordedTime = new Date(s.applicationBuilt.recordedAt).getTime();
                        const now = new Date().getTime();
                        const minutesElapsed = (now - recordedTime) / (1000 * 60);
                        isStuck = minutesElapsed > 15;
                    }

                    let buildStatus: DeploymentStep['status'] = 'pending';
                    let buildActionLabel = 'Build App';

                    if (isStuck) {
                        buildStatus = 'failure';
                        buildActionLabel = 'Rebuild App';
                    } else if (isBuilding) {
                        buildStatus = 'loading';
                        buildActionLabel = 'Rebuild App';
                    } else if (isBuilt) {
                        buildStatus = 'success';
                        buildActionLabel = 'Rebuild App';
                    } else if (isFailed) {
                        buildStatus = 'failure';
                        buildActionLabel = s.applicationBuilt.status === 'notBuilt' ? 'Build App' : 'Rebuild App';
                    }

                    mappedSteps[2] = {
                        ...mappedSteps[2],
                        status: buildStatus,
                        description: isStuck ? 'Build appears stuck (>15 min). Please rebuild.' : (s.applicationBuilt.description || (isBuilt ? 'Build folder found.' : 'Application not built.')),
                        action: { commandId: 'build-app', label: buildActionLabel }
                    };

                    if (buildStatus === 'success') {
                        // If built, app exists
                        mappedSteps[3] = { ...mappedSteps[3], status: 'success', description: s.applicationExists.description || 'Application directory found.' };
                    } else if (buildStatus === 'failure') {
                        // Check app exists
                        if (s.applicationExists.status === 'success') {
                            mappedSteps[3] = { ...mappedSteps[3], status: 'success', description: s.applicationExists.description || 'Application directory found.' };
                        } else {
                            mappedSteps[3] = { ...mappedSteps[3], status: 'failure', description: s.applicationExists.description || 'Application directory failure.' };
                        }
                    }
                }
            }

            setSteps(mappedSteps);
            setIsChecking(false);
            return;
        }

        // 2. Fallback to Deep Checks (Reverse Order - Start from Website Live)
        setSteps(initialSteps);

        let collectedStatus: Partial<AppStatus> = {};

        // Get app path first
        const appDirCheck = await checkPathExists(server.id);
        if (!appDirCheck.exists || appDirCheck.error) {
            // Can't proceed with any checks
            updateStep(0, 'failure', 'Cannot check - application directory not found.');
            updateStep(1, 'failure', 'Cannot check - application directory not found.');
            updateStep(2, 'failure', 'Cannot check - application directory not found.');
            updateStep(3, 'failure', appDirCheck.error || `Directory not found at ${appDirCheck.resolvedPath || 'the expected path'}.`);

            collectedStatus.applicationExists = {
                status: 'failure',
                recordedAt: new Date().toISOString(),
                exists: false
            };
            await updateAppStatus(server.id, collectedStatus);
            setIsChecking(false);
            return;
        }

        // Step 0 (Reverse): Check if Website is Live
        if (site.domains && site.domains.length > 0) {
            updateStep(0, 'loading', `Pinging ${site.domains[0].value}...`);
            try {
                const url = `https://${site.domains[0].value}`;
                const res = await fetch(`/api/v1/ping?url=${encodeURIComponent(url)}`, { method: 'GET', cache: 'no-cache' });
                const data = await res.json();

                let liveStatus: 'success' | 'warning' | 'failure' = 'failure';

                if (res.ok && data.success) {
                    if (data.status === 200) {
                        liveStatus = 'success';
                        updateStep(0, 'success', `URL is reachable with status 200 (OK).`);

                        // Website is live! All previous steps are implicitly successful
                        updateStep(1, 'success', 'Application is running and Nginx is configured.');
                        updateStep(2, 'success', 'Build folder exists.');
                        updateStep(3, 'success', `Directory found at ${appDirCheck.resolvedPath}.`);

                        collectedStatus.websiteLive = { status: 'success', recordedAt: new Date().toISOString(), statusCode: 200 };
                        collectedStatus.proxyConfigured = { status: 'success', recordedAt: new Date().toISOString(), description: 'Implicitly successful - website is live.' };
                        collectedStatus.applicationBuilt = { status: 'built', recordedAt: new Date().toISOString() };
                        collectedStatus.applicationExists = { status: 'success', recordedAt: new Date().toISOString(), exists: true };

                        await updateAppStatus(server.id, collectedStatus);
                        setIsChecking(false);
                        return; // Done! No need to check further
                    } else {
                        liveStatus = 'warning';
                        updateStep(0, 'warning', `URL is reachable but returned status ${data.status}.`);
                    }
                } else {
                    updateStep(0, 'failure', `URL returned status ${data.status || 'Error'}. Checking previous steps...`);
                }

                collectedStatus.websiteLive = {
                    status: liveStatus,
                    recordedAt: new Date().toISOString(),
                    statusCode: data.status
                };

            } catch (e) {
                updateStep(0, 'failure', 'Could not reach the website URL. Checking previous steps...');
                collectedStatus.websiteLive = { status: 'failure', recordedAt: new Date().toISOString() };
            }
        } else {
            updateStep(0, 'failure', 'No domain configured for this site.');
            collectedStatus.websiteLive = { status: 'failure', recordedAt: new Date().toISOString(), description: 'No domain' };
        }

        // Step 1 (Reverse): Check PM2 and Nginx Status
        updateStep(1, 'loading', 'Checking for PM2 process and Nginx config...');

        const [pm2Check, nginxAvailableCheck, nginxEnabledCheck] = await Promise.all([
            getPm2Processes(server.id),
            checkPathExists(server.id, `/etc/nginx/sites-available/${site.id}.conf`),
            checkPathExists(server.id, `/etc/nginx/sites-enabled/${site.id}.conf`)
        ]);

        let pm2Ok = false;
        let nginxOk = false;
        let stepDescription = '';

        if (!pm2Check.success) {
            stepDescription += `Could not check PM2 processes: ${pm2Check.error}. `;
        } else {
            const siteProcess = pm2Check.processes?.find(p => p.name === site.id);
            if (!siteProcess) {
                stepDescription += `PM2 process not found. `;
            } else if (siteProcess.status !== 'online') {
                stepDescription += `Process found in a crashed/stopped state. `;
            } else {
                pm2Ok = true;
                stepDescription += `PM2 process is online. `;
            }
        }

        if (!nginxAvailableCheck.exists) {
            stepDescription += `Nginx config file not found. `;
        } else if (!nginxEnabledCheck.exists) {
            stepDescription += `Nginx config not enabled. `;
        } else {
            nginxOk = true;
            stepDescription += 'Nginx config is enabled.';
        }

        collectedStatus.proxyConfigured = {
            status: (pm2Ok && nginxOk) ? 'success' : 'failure',
            recordedAt: new Date().toISOString(),
            description: stepDescription.trim()
        };

        if (pm2Ok && nginxOk) {
            updateStep(1, 'success', 'Application is running and Nginx is configured.');
            // If proxy is configured, previous steps are implicitly successful
            updateStep(2, 'success', 'Build folder exists.');
            updateStep(3, 'success', `Directory found at ${appDirCheck.resolvedPath}.`);

            collectedStatus.applicationBuilt = { status: 'built', recordedAt: new Date().toISOString() };
            collectedStatus.applicationExists = { status: 'success', recordedAt: new Date().toISOString(), exists: true };

            await updateAppStatus(server.id, collectedStatus);
            setIsChecking(false);
            return; // Done!
        } else {
            updateStep(1, 'failure', stepDescription.trim());
        }

        // Step 2 (Reverse): Check Build Status
        updateStep(2, 'loading', 'Checking for .next build folder...');
        const buildCheck = await checkPathExists(server.id, `${appDirCheck.resolvedPath}/.next`);

        collectedStatus.applicationBuilt = {
            status: buildCheck.exists ? 'built' : 'notBuilt',
            recordedAt: new Date().toISOString(),
        };

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

        if (buildCheck.exists) {
            updateStep(2, 'success', 'Build folder found.');
            // If built, app directory exists
            updateStep(3, 'success', `Directory found at ${appDirCheck.resolvedPath}.`);
            collectedStatus.applicationExists = { status: 'success', recordedAt: new Date().toISOString(), exists: true };
            await updateAppStatus(server.id, collectedStatus);
            setIsChecking(false);
            return; // Done!
        } else {
            updateStep(2, 'failure', 'Application not built. The ".next" folder is missing.');
        }

        // Step 3 (Reverse): Check Application Directory (already checked at start)
        updateStep(3, 'success', `Directory found at ${appDirCheck.resolvedPath}.`);
        collectedStatus.applicationExists = {
            status: 'success',
            recordedAt: new Date().toISOString(),
            exists: true
        };

        // Final Save of Full Status
        await updateAppStatus(server.id, collectedStatus);

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

        // In reverse order: show action if next step (higher index) is successful OR if this is the last step
        // Also show if step is failed or if it's a rebuildable success step
        const isLastStep = index === steps.length - 1;
        const nextStep = !isLastStep ? steps[index + 1] : null;
        const nextStepOk = isLastStep || (nextStep && nextStep.status === 'success');

        const canShowFixAction = nextStepOk && (step.status === 'failure' || (step.status === 'success' && (step.name === 'Application Built' || step.name === 'Start App & Configure Proxy')));

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
                {steps.map((step, index) => {
                    // In reverse order: Hide steps if next step (higher index) is not checked yet
                    if (index < steps.length - 1) {
                        const nextStep = steps[index + 1];
                        if (nextStep.status === 'pending' || nextStep.status === 'loading') {
                            // Only show if current step has meaningful status (not just default pending)
                            if (step.status === 'pending' && !step.description.includes('Waiting') && !step.description.includes('Cannot')) {
                                return null;
                            }
                        }
                        // Show failed/success steps even if next step failed (to show the cascade)
                        if (nextStep.status === 'failure' && step.status !== 'failure' && step.status !== 'success') {
                            // Hide if not explicitly marked as failed or successful
                            if (step.status === 'pending' && !step.description.includes('Cannot')) {
                                return null;
                            }
                        }
                    }

                    return (
                        <div key={step.name}>
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 pt-1">
                                    {getStatusIcon(step.status)}
                                </div>
                                <div>
                                    <p className="font-medium">{step.name}</p>
                                    <p className="text-sm text-muted-foreground">{step.description}</p>
                                    {renderStepActions(step, index)}
                                </div>
                            </div>
                        </div>
                    );
                })}
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
