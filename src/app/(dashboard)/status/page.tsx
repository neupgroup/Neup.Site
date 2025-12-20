
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getSiteServers, type Server } from '@/actions/servers';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Server as ServerIcon, CheckCircle, XCircle, AlertCircle, Rocket, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { runCommand } from '@/actions/runner';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import type { ServerAllocation } from '@/schemas/server';
import type { Site, Structure } from '@/schemas/site';
import { getPm2Processes } from '@/actions/server/management/get-pm2-processes';
import { checkPathExists, rebuildApplication } from '@/actions/server/management/check-build';
import { useProfile } from '@/context/ProfileContext';
import { getStructure, createDeployment } from '@/actions/structure';

interface DeploymentStep {
    name: string;
    status: 'pending' | 'success' | 'failure' | 'loading' | 'warning';
    description: string;
    action?: { commandId: string; label: string; };
    subActions?: { commandId: string; label: string; }[];
}

const DeploymentStatusChecker = ({ server, allocation, site, isProduction }: { server: Server, allocation: ServerAllocation, site: Site | null, isProduction: boolean }) => {
    const router = useRouter();
    const { toast } = useToast();
    const [isChecking, setIsChecking] = useState(true);
    const [isExecutingAction, setIsExecutingAction] = useState<string | null>(null);
    const [structure, setStructure] = useState<Structure | null>(null);

    const initialSteps: DeploymentStep[] = useMemo(() => [
        { name: 'Website Live', status: 'loading', description: 'Checking if website is reachable...' },
        { name: 'Application Exists', status: 'loading', description: 'Checking for application directory...', subActions: [{ commandId: 'install-requisites', label: 'Install Requisites' }, { commandId: 'install-packages', label: 'Install App' }] },
        { name: 'Deploy Structure', status: 'loading', description: 'Checking for pending structure changes...', action: { commandId: 'deploy-structure', label: 'Redeploy Structure' } },
        { name: 'Application Built', status: 'loading', description: 'Checking for .next build folder...', action: { commandId: 'build-app', label: 'Build App' } },
        { name: 'Start App & Configure Proxy', status: 'loading', description: 'Checking PM2 process and Nginx config...', action: { commandId: 'start-app-and-configure-proxy', label: 'Restart App & Proxy' } },
    ], []);
    const [steps, setSteps] = useState<DeploymentStep[]>(initialSteps);
    const hasRunChecks = useRef(false);

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
        setSteps(initialSteps); // Reset steps to loading state

        // Check if domain is configured
        const domainUrl = isProduction
            ? site.domains?.production?.url
            : site.domains?.development?.url;

        if (!domainUrl) {
            // Domain not configured - skip all checks
            setIsChecking(false);
            return;
        }

        // STEP 1: Check if Website is Live
        let websiteIsLive = false;

        updateStep(0, 'loading', `Pinging ${domainUrl}...`);
        try {
            const url = `https://${domainUrl}`;
            const res = await fetch(`/api/v1/ping?url=${encodeURIComponent(url)}`, { method: 'GET', cache: 'no-cache' });
            const data = await res.json();

            if (res.ok && data.success && data.status === 200) {
                updateStep(0, 'success', `Website is live and reachable (Status 200).`);
                websiteIsLive = true;
            } else {
                const statusCode = data.status || 'Unknown';
                updateStep(0, 'failure', `Website is not reachable (Status ${statusCode}).`);
            }
        } catch (e) {
            updateStep(0, 'failure', 'Could not reach the website URL.');
        }

        // If website is live, skip all checks except Deploy Structure
        if (websiteIsLive) {
            // Mark other steps as success
            updateStep(1, 'success', 'Application is running correctly.');
            updateStep(3, 'success', 'Application is built.');
            updateStep(4, 'success', 'App and proxy are configured.');

            // STEP 3: Deploy Structure Check (always check from database)
            updateStep(2, 'loading', 'Checking for pending structure changes...');
            const structureResult = await getStructure();
            if (structureResult.success) {
                const fetchedStructure = structureResult.structure || null;
                setStructure(fetchedStructure);
                if (fetchedStructure?.status === 'pendingDeployment') {
                    updateStep(2, 'warning', 'Structure changes are pending deployment.');
                } else {
                    updateStep(2, 'success', 'Structure is up to date.');
                }
            } else {
                updateStep(2, 'failure', 'Could not check structure status.');
            }

            setIsChecking(false);
            return;
        }

        // If website is NOT live, continue with detailed checks to diagnose the issue

        // STEP 2: Check if Application Exists
        updateStep(1, 'loading', 'Checking for application directory...');
        const appDirCheck = await checkPathExists(server.id, undefined, isProduction);

        if (!appDirCheck.exists || appDirCheck.error) {
            updateStep(1, 'failure', appDirCheck.error || 'Application directory not found.');
            // Fail subsequent steps
            updateStep(2, 'failure', 'Cannot check - application directory not found.');
            updateStep(3, 'failure', 'Cannot check - application directory not found.');
            updateStep(4, 'failure', 'Cannot check - application directory not found.');
            setIsChecking(false);
            return;
        }
        updateStep(1, 'success', `Application directory found at ${appDirCheck.resolvedPath}.`);

        // STEP 3: Deploy Structure Check
        // This check is now handled within the websiteIsLive block, but also needs to run if website is NOT live.
        // So, we keep it here for the non-live path.
        updateStep(2, 'loading', 'Checking for pending structure changes...');
        const structureResult = await getStructure();
        if (structureResult.success) {
            const fetchedStructure = structureResult.structure || null;
            setStructure(fetchedStructure);
            if (fetchedStructure?.status === 'pendingDeployment') {
                updateStep(2, 'warning', 'Structure changes are pending deployment.');
            } else {
                updateStep(2, 'success', 'Structure is up to date.');
            }
        } else {
            updateStep(2, 'failure', 'Could not check structure status.');
        }

        // STEP 4: Check if Application is Built
        updateStep(3, 'loading', 'Checking for .next build folder...');
        const buildCheck = await checkPathExists(server.id, `${appDirCheck.resolvedPath}/.next`, isProduction);

        setSteps(prev => {
            const newSteps = [...prev];
            if (newSteps[3]) {
                const actionLabel = buildCheck.exists ? 'Rebuild App' : 'Build App';
                newSteps[3] = {
                    ...newSteps[3],
                    action: { commandId: 'build-app', label: actionLabel }
                };
            }
            return newSteps;
        });

        if (!buildCheck.exists) {
            updateStep(3, 'failure', 'Application not built. The ".next" folder is missing.');
            updateStep(4, 'failure', 'Cannot check - application not built.');
            setIsChecking(false);
            return;
        }
        updateStep(3, 'success', 'Build folder found.');

        // STEP 5: Check if App is Started and Proxy is Configured
        updateStep(4, 'loading', 'Checking PM2 process and Nginx configuration...');

        const pm2ProcessName = isProduction ? site.id : `${site.id}.development`;
        const nginxConfigName = isProduction ? site.id : `${site.id}.development`;

        const [pm2Check, nginxAvailableCheck, nginxEnabledCheck] = await Promise.all([
            getPm2Processes(server.id),
            checkPathExists(server.id, `/etc/nginx/sites-available/${nginxConfigName}.conf`, isProduction),
            checkPathExists(server.id, `/etc/nginx/sites-enabled/${nginxConfigName}.conf`, isProduction)
        ]);

        let pm2Ok = false;
        let nginxOk = false;
        let stepDescription = '';

        if (!pm2Check.success) {
            stepDescription += `Could not check PM2 processes: ${pm2Check.error}. `;
        } else {
            const siteProcess = pm2Check.processes?.find(p => p.name === pm2ProcessName);
            if (!siteProcess) {
                stepDescription += `PM2 process not found. `;
            } else if (siteProcess.status !== 'online') {
                stepDescription += `PM2 process is ${siteProcess.status}. `;
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

        if (pm2Ok && nginxOk) {
            updateStep(4, 'success', stepDescription.trim());
        } else {
            updateStep(4, 'failure', stepDescription.trim());
        }

        setIsChecking(false);
    }, [server.id, site, isProduction]);

    useEffect(() => {
        if (!hasRunChecks.current) {
            hasRunChecks.current = true;
            runChecks();
        }
    }, [runChecks]);

    const handleActionClick = async (clickedStepIndex: number) => {
        if (!site) return;

        const clickedStep = steps[clickedStepIndex];
        if (!clickedStep || !clickedStep.action) return;

        setIsExecutingAction(clickedStep.name);
        updateStep(clickedStepIndex, 'loading', `Executing: ${clickedStep.action.label}...`);

        let result: { success: boolean; error?: string; logId?: string; finalStatus?: any } = { success: false };

        if (clickedStep.action.commandId === 'deploy-structure') {
            result = await createDeployment();
            // Refresh structure status after deployment
            if (result.success) {
                const structureResult = await getStructure();
                if (structureResult.success) {
                    setStructure(structureResult.structure || null);
                }
            }
        } else if (clickedStep.action.commandId === 'build-app') {
            result = await rebuildApplication(server.id, isProduction);
        } else {
            result = await runCommand(server.id, clickedStep.action.commandId, {}, clickedStep.action.label);
        }

        if (result.success) {
            if (clickedStep.action.commandId === 'deploy-structure') {
                updateStep(clickedStepIndex, 'success', 'Structure is up to date.');
            } else {
                updateStep(clickedStepIndex, 'success', `${clickedStep.action.label} completed successfully.`);
            }
            toast({ title: 'Action Succeeded!', description: `${clickedStep.action.label} completed.` });
        } else {
            updateStep(clickedStepIndex, 'failure', `Action "${clickedStep.action.label}" failed.`);
            toast({ variant: 'destructive', title: 'Action Failed', description: result.error || 'An unknown error occurred.' });
            if (result.logId) {
                router.push(`/root/servers/${server.id}?log=${result.logId}`);
            }
        }

        setIsExecutingAction(null);
        setTimeout(() => runChecks(), 2000);
    };

    const renderStepDescription = (step: DeploymentStep, index: number) => {
        let canShowAction = false;
        if (index === 0) {
            return <p className="text-sm text-muted-foreground">{step.description}</p>;
        }

        if (step.action?.commandId === 'deploy-structure') {
            canShowAction = structure?.status === 'pendingDeployment';
        } else {
            const allPreviousSuccessful = steps.slice(1, index).every(s => s.status === 'success' || s.status === 'warning');
            canShowAction = (step.status === 'failure' || (step.status === 'success' && (step.name === 'Application Built' || step.name === 'Start App & Configure Proxy'))) && allPreviousSuccessful;
        }

        if (canShowAction && step.action) {
            const isSuccess = step.status === 'success';
            const actionText = isSuccess ? `${step.action.label} again` : step.action.label;

            // Special handling for the last step (Start App & Configure Proxy) when successful
            if (isSuccess && step.name === 'Start App & Configure Proxy') {
                return (
                    <p className="text-sm text-muted-foreground">
                        {step.description}
                        {step.description.endsWith('.') ? '' : '.'}{' '}
                        <button
                            onClick={() => handleActionClick(index)}
                            disabled={!!isExecutingAction}
                            className="text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isExecutingAction === step.name ? (
                                <span className="inline-flex items-center gap-1">
                                    <Loader2 className="h-3 w-3 animate-spin inline" />
                                    {actionText}...
                                </span>
                            ) : (
                                actionText
                            )}
                        </button> or just{' '}
                        <button
                            onClick={async () => {
                                setIsExecutingAction('restart-app');
                                const result = await runCommand(server.id, 'restart-app', {}, 'Restart App');
                                if (result.success) {
                                    toast({ title: 'App Restarted', description: 'The application has been restarted successfully.' });
                                    setTimeout(() => runChecks(), 2000);
                                } else {
                                    toast({ variant: 'destructive', title: 'Restart Failed', description: result.error || 'Failed to restart the app.' });
                                }
                                setIsExecutingAction(null);
                            }}
                            disabled={!!isExecutingAction}
                            className="text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isExecutingAction === 'restart-app' ? (
                                <span className="inline-flex items-center gap-1">
                                    <Loader2 className="h-3 w-3 animate-spin inline" />
                                    Restart the app...
                                </span>
                            ) : (
                                'Restart the app'
                            )}
                        </button>.
                    </p>
                );
            }

            return (
                <p className="text-sm text-muted-foreground">
                    {step.description}
                    {step.description.endsWith('.') ? '' : '.'}{' '}
                    <button
                        onClick={() => handleActionClick(index)}
                        disabled={!!isExecutingAction}
                        className="text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isExecutingAction === step.name ? (
                            <span className="inline-flex items-center gap-1">
                                <Loader2 className="h-3 w-3 animate-spin inline" />
                                {actionText}...
                            </span>
                        ) : (
                            actionText
                        )}
                    </button>.
                    {step.subActions && step.subActions.length > 0 && (
                        <>
                            {step.subActions.map((subAction, idx) => (
                                <span key={subAction.commandId}>
                                    {' '}
                                    <button
                                        onClick={() => runCommand(server.id, subAction.commandId, {})}
                                        disabled={!!isExecutingAction}
                                        className="text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {subAction.label}
                                    </button>.
                                </span>
                            ))}
                        </>
                    )}
                </p>
            );
        }

        return <p className="text-sm text-muted-foreground">{step.description}</p>;
    };

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
                        <Globe className="h-5 w-5" />
                        <span className="truncate">
                            {isProduction
                                ? (site?.domains?.production?.url || 'Production Domain Not Set')
                                : (site?.domains?.development?.url || 'Development Domain Not Set')
                            }
                        </span>
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {isProduction ? 'Production' : 'Development'}
                    </div>
                </div>
                <CardDescription className="truncate font-mono">{server.name} • {server.publicIp}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {!site?.domains?.[isProduction ? 'production' : 'development']?.url ? (
                    <div className="text-center py-8">
                        <p className="text-muted-foreground mb-4">
                            Configure your {isProduction ? 'production' : 'development'} domain to check your app's status.
                        </p>
                        <Button variant="outline" onClick={() => window.location.href = '/settings/domain'}>
                            Configure Domain
                        </Button>
                    </div>
                ) : (
                    <>
                        {steps.map((step, index) => (
                            <div key={step.name}>
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 pt-1">
                                        {getStatusIcon(step.status)}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium">{step.name}</p>
                                        {renderStepDescription(step, index)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </>
                )}
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

    // Use the first allocated server for both production and development
    const allocatedServer = servers.length > 0 ? servers[0] : null;

    const productionDomain = site?.domains?.production?.url;
    const developmentDomain = site?.domains?.development?.url;

    return (
        <div className="w-full max-w-4xl mx-auto">
            <header className="mb-8">
                <h1 className="font-headline text-3xl font-bold tracking-tight">Application Status</h1>
                <p className="text-muted-foreground">Check the deployment status of your application on its allocated servers.</p>
            </header>

            {loading ? (
                <div className="space-y-6">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            ) : error ? (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            ) : (
                <div className="space-y-6">
                    {/* Production Card */}
                    {allocatedServer ? (
                        <DeploymentStatusChecker
                            key={`${allocatedServer.id}-production`}
                            server={allocatedServer}
                            allocation={allocatedServer.allocation}
                            site={site}
                            isProduction={true}
                        />
                    ) : (
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle className="flex items-center gap-2">
                                        <Globe className="h-5 w-5" />
                                        <span className="truncate">
                                            {productionDomain || 'Production Domain Not Set'}
                                        </span>
                                    </CardTitle>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        Production
                                    </div>
                                </div>
                                <CardDescription>No server allocated</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-8">
                                    <p className="text-muted-foreground mb-4">
                                        No server is currently allocated for the production application.
                                    </p>
                                    <Button disabled>
                                        <Rocket className="mr-2 h-4 w-4" />
                                        Start Production App
                                    </Button>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Allocate a server first to enable deployment
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Development Card */}
                    {allocatedServer ? (
                        <DeploymentStatusChecker
                            key={`${allocatedServer.id}-development`}
                            server={allocatedServer}
                            allocation={allocatedServer.allocation}
                            site={site}
                            isProduction={false}
                        />
                    ) : (
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle className="flex items-center gap-2">
                                        <Globe className="h-5 w-5" />
                                        <span className="truncate">
                                            {developmentDomain || 'Development Domain Not Set'}
                                        </span>
                                    </CardTitle>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        Development
                                    </div>
                                </div>
                                <CardDescription>No server allocated</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-8">
                                    <p className="text-muted-foreground mb-4">
                                        No server is currently allocated for the development application.
                                    </p>
                                    <Button disabled>
                                        <Rocket className="mr-2 h-4 w-4" />
                                        Start Development App
                                    </Button>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Allocate a server first to enable deployment
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}
