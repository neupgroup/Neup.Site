

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@neup/components/ui/card';
import { Button } from '@neup/components/ui/button';
import { LinkButton } from '@neup/components/ui/link-button';
import { GitBranch, CheckCircle, Clock, Loader2, AlertCircle, Rocket, Palette, Redo, Image as ImageIcon, FolderKanban, FileLock, Download, RotateCcw } from 'lucide-react';
import { getStructure, createDeployment, markAssetsAsPending, markRedirectsAsPending, markThemeAsPending, getLastDeployment } from '@/services/structure';
import type { Structure, Deployment } from '@/services/asset/type';
import { getSiteServers } from '@/services/servers';
import { useRouter } from 'next/navigation';
import { useToast } from '@neup/core/hooks/useToast';
import { Alert, AlertTitle, AlertDescription } from '@neup/components/ui/alert';
import { usePageTitle } from '@neup/core/hooks/use-page-title';

const StatusCard = ({ title, description, status, icon: Icon, onDeploy, href }: { title: string; description: string; status: 'loading' | 'pending' | 'deployed'; icon: React.ElementType, onDeploy: () => void; href: string }) => {
    return (
        <Link href={`${href}${typeof window !== 'undefined' ? window.location.search : ''}`} className="block transition-colors hover:bg-muted/50">
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
                    <Button variant="text" size="sm" className="p-0 h-auto text-xs mt-1" onClick={(event) => { event.preventDefault(); event.stopPropagation(); onDeploy(); }}>
                        Deploy again?
                    </Button>
                )}
            </CardContent>
        </Card>
        </Link>
    );
};


export default function DeployPage() {
    usePageTitle('App Base');
    const [structure, setStructure] = useState<Structure | null>(null);
    const [lastDeployment, setLastDeployment] = useState<Deployment | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDeploying, setIsDeploying] = useState(false);
    const [isDownloadingBaseFiles, setIsDownloadingBaseFiles] = useState(false);
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

    const handleDownloadBaseFiles = async () => {
        setIsDownloadingBaseFiles(true);
        try {
            const appBasePath = process.env.NEXT_PUBLIC_APP_BASEPATH || '';
            const response = await fetch(`${appBasePath}/bridge/api.v1/appbase/download${window.location.search}`);
            if (!response.ok) {
                const result = await response.json().catch(() => null);
                throw new Error(result?.error || 'Could not create base files archive.');
            }
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'basefile.zip';
            link.click();
            URL.revokeObjectURL(url);
        } catch (downloadError: any) {
            toast({ variant: 'destructive', title: 'Download Failed', description: downloadError.message });
        } finally {
            setIsDownloadingBaseFiles(false);
        }
    };
    
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
                  <h1 className="font-headline text-2xl font-semibold tracking-tight">App Base</h1>
                  <p className="text-muted-foreground">
                        Deploy your site structure, assets, and configurations to your servers.
                  </p>
                </div>
                <LinkButton variant="outlined" href="/appbase/backups">
                    <RotateCcw className="mr-2 h-4 w-4" /> View Backups
                </LinkButton>
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
                        href="/site/advanced"
                    />
                     <StatusCard 
                        title="Theme" 
                        description={hasPendingTheme ? "Color or style changes pending" : "Up to date"}
                        status={getStatus(hasPendingTheme)}
                        icon={Palette}
                         onDeploy={() => handleForceDeploy('theme')}
                         href="/settings/design"
                    />
                     <StatusCard 
                        title="Redirects" 
                        description={hasPendingRedirects ? "URL redirect changes pending" : "Up to date"}
                        status={getStatus(hasPendingRedirects)}
                        icon={Redo}
                         onDeploy={() => handleForceDeploy('redirects')}
                         href="/manage/redirects"
                    />
                     <StatusCard 
                        title="Asset Assets" 
                        description={hasPendingAssets ? "Logo or profile changes pending" : "Up to date"}
                        status={getStatus(hasPendingAssets)}
                        icon={ImageIcon}
                        onDeploy={() => handleForceDeploy('assets')}
                        href="/identity"
                    />
                    <StatusCard
                        title="Custom Data"
                        description={hasPendingAppBase ? "Custom data changes pending" : "Up to date"}
                        status={getStatus(hasPendingAppBase)}
                        icon={FolderKanban}
                        onDeploy={() => {}}
                        href="/appbase/custom"
                    />
                    <StatusCard
                        title="Environments"
                        description={hasPendingEnvironments ? "Environment variable changes pending" : "Up to date"}
                        status={getStatus(hasPendingEnvironments)}
                        icon={FileLock}
                        onDeploy={() => {}}
                        href="/appbase/environments"
                    />
                </div>
            </div>
            
            <div className="mt-8">
                {hasServer ? (
                    hasAnyPendingChanges ? (
                        <Button variant="solid" onClick={handleDeploy} disabled={isDeploying || loading}>
                            {isDeploying ? <Loader2 className="animate-spin mr-2" /> : <Rocket className="mr-2 h-4 w-4" />}
                            {isDeploying ? 'Deploying...' : 'Deploy All Changes'}
                        </Button>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Up to date</span>
                            <Button variant="text" className="p-0 h-auto" onClick={handleDeploy} disabled={isDeploying || loading}>
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
            <div className="mt-8 border-t pt-6">
                <Button variant="outlined" onClick={handleDownloadBaseFiles} disabled={isDownloadingBaseFiles || loading}>
                    {isDownloadingBaseFiles ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    {isDownloadingBaseFiles ? 'Preparing...' : 'Download Base Files'}
                </Button>
            </div>
        </div >
    );
}
