

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '#/components/ui/card';
import { Button } from '#/components/ui/buttons';
import { GitBranch, CheckCircle, Clock, Loader2, AlertCircle, Rocket, Palette, Redo, Image as ImageIcon, FolderKanban, FileLock } from 'lucide-react';
import { getStructure, createDeployment, markAssetsAsPending, markRedirectsAsPending, markThemeAsPending, getLastDeployment } from '@/services/structure';
import type { Structure, Deployment } from '@/services/asset/type';
import { getSiteServers } from '@/services/servers';
import { useRouter } from 'next/navigation';
import { useToast } from '#/core/hooks/useToast';
import { Alert, AlertTitle, AlertDescription } from '#/components/ui/alert';
import { usePageTitle } from '#/core/hooks/use-page-title';

const StatusCard = ({ title, description, status, icon: Icon, onDeploy }: { title: string; description: string; status: 'loading' | 'pending' | 'deployed'; icon: React.ElementType, onDeploy: () => void }) => {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2">
                    {status === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
                    {status === 'pending' && <Clock className="h-4 w-4 text-amber-500" />}
                    {status === 'deployed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                 {status === 'deployed' && (
                    <Button variant="link" size="sm" className="p-0 h-auto text-xs mt-1" onClick={onDeploy}>
                        Deploy again?
                    </Button>
                )}
            </CardContent>
        </Card>
    );
};


export default function DeployPage() {
    usePageTitle('Deployments');
    const [structure, setStructure] = useState<Structure | null>(null);
    const [lastDeployment, setLastDeployment] = useState<Deployment | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDeploying, setIsDeploying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasServer, setHasServer] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const fetchDeploymentData = useCallback(async () => {
        setLoading(true);
        const [structureResult, deploymentResult, serverResult] = await Promise.all([
            getStructure(),
            getLastDeployment(),
            getSiteServers()
        ]);

        if (structureResult.success) {
            setStructure(structureResult.structure || null);
        } else {
            setError(structureResult.error || 'Failed to fetch deployment status.');
        }

        if (deploymentResult.success) {
            setLastDeployment(deploymentResult.deployment || null);
        }

        setHasServer(Boolean(serverResult.success && serverResult.servers && serverResult.servers.length > 0));
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchDeploymentData();
    }, [fetchDeploymentData]);

    const handleDeploy = async () => {
        setIsDeploying(true);
        const result = await createDeployment();
        if (result.success) {
            toast({ title: "Deployment Successful", description: "Your changes have been deployed." });
            await fetchDeploymentData();
        } else {
            toast({ variant: "destructive", title: "Deployment Failed", description: result.error });
        }
        setIsDeploying(false);
    }
    
    const handleForceDeploy = async (type: 'theme' | 'redirects' | 'assets' | 'structure') => {
        if (!structure?.assetId) return;

        setIsDeploying(true);
        toast({ title: "Initiating Deployment...", description: `Marking ${type} as pending.` });

        try {
            if (type === 'theme') {
                await markThemeAsPending(structure.assetId);
            } else if (type === 'redirects') {
                await markRedirectsAsPending(structure.assetId);
            } else if (type === 'assets') {
                await markAssetsAsPending(structure.assetId);
            }
            
            await handleDeploy();

        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not force deployment.'});
            setIsDeploying(false);
        }
    }
    
    const hasPendingStructure = structure?.structure.some(s => s.changesMade) || false;
    const hasPendingTheme = structure?.themeChanged || false;
    const hasPendingRedirects = structure?.redirectsChanged || false;
    const hasPendingAssets = structure?.assetsChanged || false;
    const hasPendingAppBase = structure?.appBaseChanged || false;
    const hasPendingEnvironments = structure?.environmentsChanged || false;

    const hasAnyPendingChanges = hasPendingStructure || hasPendingTheme || hasPendingRedirects || hasPendingAssets || hasPendingAppBase || hasPendingEnvironments;
    
    const getStatus = (hasChanged: boolean) => {
        if (loading) return 'loading';
        return hasChanged ? 'pending' : 'deployed';
    };

    return (
        <div className="w-full">
            <header className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="font-headline text-2xl font-semibold tracking-tight">Deployments</h1>
                  <p className="text-muted-foreground">
                        Deploy your site structure, assets, and configurations to your servers.
                  </p>
                </div>
            </header>
            
            <div className="space-y-4">
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                <div className="grid grid-cols-1 gap-4">
                    <StatusCard 
                        title="Structure" 
                        description={hasPendingStructure ? "Path or page content changes pending" : "Up to date"}
                        status={getStatus(hasPendingStructure)}
                        icon={GitBranch}
                         onDeploy={() => handleForceDeploy('structure')}
                    />
                     <StatusCard 
                        title="Theme" 
                        description={hasPendingTheme ? "Color or style changes pending" : "Up to date"}
                        status={getStatus(hasPendingTheme)}
                        icon={Palette}
                         onDeploy={() => handleForceDeploy('theme')}
                    />
                     <StatusCard 
                        title="Redirects" 
                        description={hasPendingRedirects ? "URL redirect changes pending" : "Up to date"}
                        status={getStatus(hasPendingRedirects)}
                        icon={Redo}
                         onDeploy={() => handleForceDeploy('redirects')}
                    />
                     <StatusCard 
                        title="Asset Assets" 
                        description={hasPendingAssets ? "Logo or profile changes pending" : "Up to date"}
                        status={getStatus(hasPendingAssets)}
                        icon={ImageIcon}
                        onDeploy={() => handleForceDeploy('assets')}
                    />
                    <StatusCard
                        title="App Base"
                        description={hasPendingAppBase ? "App base file changes pending" : "Up to date"}
                        status={getStatus(hasPendingAppBase)}
                        icon={FolderKanban}
                        onDeploy={() => {}}
                    />
                    <StatusCard
                        title="Environments"
                        description={hasPendingEnvironments ? "Environment variable changes pending" : "Up to date"}
                        status={getStatus(hasPendingEnvironments)}
                        icon={FileLock}
                        onDeploy={() => {}}
                    />
                </div>
            </div>
            
            <div className="mt-8">
                {hasServer ? (
                    hasAnyPendingChanges ? (
                        <Button variant="primary" onClick={handleDeploy} disabled={isDeploying || loading}>
                            {isDeploying ? <Loader2 className="animate-spin mr-2" /> : <Rocket className="mr-2 h-4 w-4" />}
                            {isDeploying ? 'Deploying...' : 'Deploy All Changes'}
                        </Button>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Up to date</span>
                            <Button variant="link" className="p-0 h-auto" onClick={handleDeploy} disabled={isDeploying || loading}>
                                {isDeploying ? 'Deploying...' : 'Deploy again?'}
                            </Button>
                        </div>
                    )
                ) : (
                    <Alert variant="destructive" className="w-full">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>No Server Assigned</AlertTitle>
                        <AlertDescription>
                            You must assign a server to this site in the server management settings before you can deploy.
                        </AlertDescription>
                    </Alert>
                )}
            </div>
        </div >
    );
}
