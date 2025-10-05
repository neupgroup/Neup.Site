
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GitBranch, CheckCircle, Clock, Loader2, AlertCircle } from 'lucide-react';
import { getStructure, buildStructure, createDeployment, getLastDeployment, type Structure, type Deployment } from '@/actions/structure';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function DeployPage() {
    const [structure, setStructure] = useState<Structure | null>(null);
    const [lastDeployment, setLastDeployment] = useState<Deployment | null>(null);
    const [loading, setLoading] = useState(true);
    const [isBuilding, setIsBuilding] = useState(false);
    const [isDeploying, setIsDeploying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchDeploymentData = async () => {
        setLoading(true);
        const [structureResult, deploymentResult] = await Promise.all([
            getStructure(),
            getLastDeployment()
        ]);

        if (structureResult.success) {
            setStructure(structureResult.structure || null);
        } else {
            setError(structureResult.error || 'Failed to fetch deployment status.');
        }

        if (deploymentResult.success) {
            setLastDeployment(deploymentResult.deployment || null);
        } else if (deploymentResult.error) {
            // Only log an error if there was an actual error, not just if it was not found.
            console.warn("Could not fetch last deployment:", deploymentResult.error);
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchDeploymentData();
    }, []);

    const handleBuild = async () => {
        setIsBuilding(true);
        const result = await buildStructure();
        if (result.success) {
            toast({ title: "Build Complete", description: "The site structure has been built."});
            await fetchDeploymentData(); // Refresh the data
        } else {
            toast({ variant: "destructive", title: "Build Failed", description: result.error });
        }
        setIsBuilding(false);
    }
    
    const handleDeploy = async () => {
        setIsDeploying(true);
        const result = await createDeployment();
        if (result.success) {
            toast({ title: "Deployment Successful", description: "Your changes have been deployed."});
            await fetchDeploymentData(); // Refresh the data
        } else {
            toast({ variant: "destructive", title: "Deployment Failed", description: result.error });
        }
        setIsDeploying(false);
    }

    const hasPendingChanges = structure?.status === 'pendingDeployment' || structure?.structure.some(s => s.changesMade);

    return (
        <div className="w-full">
            <header className="flex items-center justify-between mb-8">
                <h1 className="font-headline text-2xl font-semibold tracking-tight">Deployments</h1>
            </header>
            <Card>
                <CardHeader>
                    <CardTitle>Site Deployment</CardTitle>
                    <CardDescription>
                        Build and deploy your site structure to your servers.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg">Current Status</CardTitle>
                                {loading ? (
                                    <p className="text-sm text-muted-foreground">Loading...</p>
                                ) : error ? (
                                    <p className="text-sm text-destructive">Error loading status</p>
                                ) : (
                                    <p className="text-sm text-muted-foreground">Last deployed: {lastDeployment?.attemptedOn ? new Date(lastDeployment.attemptedOn).toLocaleString() : 'Never'}</p>
                                )}
                            </div>
                             {loading ? <Loader2 className="animate-spin" /> :
                             hasPendingChanges ? (
                                 <Badge variant="outline" className="text-amber-600 border-amber-500">
                                    <Clock className="mr-2 h-4 w-4" />
                                    Pending Deployment
                                </Badge>
                             ) : (
                                <Badge variant="outline" className="text-green-600 border-green-500">
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Deployed
                                </Badge>
                             )
                            }
                        </CardHeader>
                    </Card>

                    {structure && structure.structure.length > 0 && (
                        <Card>
                             <CardHeader>
                                <CardTitle className="text-lg">Changed Paths</CardTitle>
                             </CardHeader>
                             <CardContent>
                                <ScrollArea className="h-48">
                                    <div className="space-y-2">
                                        {structure.structure.filter(s => s.changesMade).map(s => (
                                            <div key={s.path} className="font-mono text-sm p-2 bg-muted rounded-md">{s.path}</div>
                                        ))}
                                        {!structure.structure.some(s => s.changesMade) && (
                                            <p className="text-sm text-muted-foreground text-center py-4">No pending changes.</p>
                                        )}
                                    </div>
                                </ScrollArea>
                             </CardContent>
                        </Card>
                    )}

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                </CardContent>
                <CardFooter className="flex-col sm:flex-row gap-4">
                    <Button onClick={handleBuild} disabled={isBuilding || isDeploying}>
                        {isBuilding ? <Loader2 className="animate-spin mr-2" /> : <GitBranch className="mr-2 h-4 w-4" />}
                        {isBuilding ? 'Building...' : 'Build Structure'}
                    </Button>
                    {hasPendingChanges && (
                        <Button onClick={handleDeploy} disabled={isDeploying || isBuilding}>
                            {isDeploying ? <Loader2 className="animate-spin mr-2" /> : null}
                            Deploy to Server(s)
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
