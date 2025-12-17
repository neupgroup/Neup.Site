
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GitBranch, CheckCircle, Clock, Loader2, AlertCircle, Rocket, Palette, Redo, Image as ImageIcon } from 'lucide-react';
import { getStructure, createDeployment, getLastDeployment } from '@/actions/structure';
import type { Structure, Deployment } from '@/schemas/site';
import { getSiteServers } from '@/actions/servers';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

const StatusCard = ({ title, description, status, icon: Icon }: { title: string; description: string; status: 'loading' | 'pending' | 'deployed'; icon: React.ElementType }) => {
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
            </CardContent>
        </Card>
    );
};


export default function DeployPage() {
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

        setHasServer(serverResult.success && serverResult.servers && serverResult.servers.length > 0);
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
    
    const hasPendingStructure = structure?.structure.some(s => s.changesMade) || false;
    const hasPendingTheme = structure?.themeChanged || false;
    const hasPendingRedirects = structure?.redirectsChanged || false;
    const hasPendingAssets = structure?.assetsChanged || false;

    const hasAnyPendingChanges = hasPendingStructure || hasPendingTheme || hasPendingRedirects || hasPendingAssets;
    
    const getStatus = (hasChanged: boolean) => {
        if (loading) return 'loading';
        return hasChanged ? 'pending' : 'deployed';
    };

    return (
        <div className="w-full">
            <header className="flex items-center justify-between mb-8">
                <h1 className="font-headline text-2xl font-semibold tracking-tight">Deployments</h1>
            </header>
            <Card>
                <CardHeader>
                    <CardTitle>Site Deployment</CardTitle>
                    <CardDescription>
                        Deploy your site structure, assets, and configurations to your servers.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <StatusCard 
                            title="Structure" 
                            description={hasPendingStructure ? "Path or page content changes pending" : "Up to date"}
                            status={getStatus(hasPendingStructure)}
                            icon={GitBranch}
                        />
                         <StatusCard 
                            title="Theme" 
                            description={hasPendingTheme ? "Color or style changes pending" : "Up to date"}
                            status={getStatus(hasPendingTheme)}
                            icon={Palette}
                        />
                         <StatusCard 
                            title="Redirects" 
                            description={hasPendingRedirects ? "URL redirect changes pending" : "Up to date"}
                            status={getStatus(hasPendingRedirects)}
                            icon={Redo}
                        />
                         <StatusCard 
                            title="Site Assets" 
                            description={hasPendingAssets ? "Logo or profile changes pending" : "Up to date"}
                            status={getStatus(hasPendingAssets)}
                            icon={ImageIcon}
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    {hasServer ? (
                        <Button onClick={handleDeploy} disabled={isDeploying || loading || !hasAnyPendingChanges}>
                            {isDeploying ? <Loader2 className="animate-spin mr-2" /> : <Rocket className="mr-2 h-4 w-4" />}
                            {isDeploying ? 'Deploying...' : (hasAnyPendingChanges ? 'Deploy All Changes' : 'Nothing to Deploy')}
                        </Button>
                    ) : (
                        <Alert variant="destructive" className="w-full">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>No Server Assigned</AlertTitle>
                            <AlertDescription>
                                You must assign a server to this site in the server management settings before you can deploy.
                            </AlertDescription>
                        </Alert>
                    )}
                </CardFooter>
            </Card>
        </div >
    );
}
