
'use client';

import { useState, useEffect } from 'react';
import { getArtifactsForAccount, createArtifactForAccount, type ArtifactSummary } from '@/actions/artifacts';
import { setArtifactIdCookie } from '@/actions/auth';
import { useToast } from '@/hooks/use-toast';
import { useProfile } from '@/context/ProfileContext';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { AlertCircle, Package, Loader2, ArrowRight, CheckCircle, Plus } from 'lucide-react';
import { getCookie } from '@/lib/session-manager';
import { usePageTitle } from '@/hooks/use-page-title';

function ArtifactList() {
    const [allArtifacts, setAllArtifacts] = useState<ArtifactSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSwitching, setIsSwitching] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [activeArtifactId, setActiveArtifactId] = useState<string | null>(null);
    const [createForm, setCreateForm] = useState({
        name: '',
    });

    const { toast } = useToast();

    useEffect(() => {
        const fetchArtifacts = async () => {
            setLoading(true);
            const { artifacts, error } = await getArtifactsForAccount();
            if (error) {
                setError(error);
            } else {
                setAllArtifacts(artifacts || []);
                setActiveArtifactId(getCookie('artifactId'));
            }
            setLoading(false);
        };
        fetchArtifacts();
    }, []);

    const handleSelectArtifact = async (artifactId: string) => {
        setIsSwitching(artifactId);
        const result = await setArtifactIdCookie(artifactId);
        if (result.success) {
            toast({ title: 'Artifact Switched', description: `You are now working on artifact: ${artifactId}.` });
            setActiveArtifactId(artifactId);
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
        setIsSwitching(null);
    };

    const handleCreateArtifact = async () => {
        if (!createForm.name.trim()) {
            toast({ variant: 'destructive', title: 'Missing name', description: 'Artifact name is required.' });
            return;
        }

        setIsCreating(true);
        const result = await createArtifactForAccount({
            name: createForm.name,
        });

        if (result.success && result.artifact) {
            setAllArtifacts((prev) => [result.artifact!, ...prev]);
            setCreateForm({ name: '' });
            await handleSelectArtifact(result.artifact.id);
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }

        setIsCreating(false);
    };

    const otherArtifacts = allArtifacts.filter(artifact => artifact.id !== activeArtifactId);
    const currentArtifact = allArtifacts.find(artifact => artifact.id === activeArtifactId);

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }
    
    return (
        <div className="w-full space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Create Artifact</CardTitle>
                    <CardDescription>Start a new artifact for your account.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Name</label>
                        <Input
                            value={createForm.name}
                            onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
                            placeholder="Artifact name"
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleCreateArtifact} disabled={isCreating}>
                        {isCreating ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Plus className="mr-2 h-4 w-4" />
                        )}
                        Create Artifact
                    </Button>
                </CardFooter>
            </Card>

            {currentArtifact && (
                <div>
                    <h2 className="text-lg font-semibold mb-2">Current Artifact</h2>
                    <div className="p-3 bg-primary/10 rounded-md flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 border-2 border-primary">
                        <div className="flex items-center gap-3">
                            <Package className="h-5 w-5 text-primary" />
                            <div>
                                <p className="font-semibold">{currentArtifact.name}</p>
                                <p className="text-sm text-muted-foreground font-mono">{currentArtifact.id}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-green-600">
                           <CheckCircle className="h-5 w-5" />
                           <span className="font-semibold">Selected</span>
                        </div>
                    </div>
                </div>
            )}

            {otherArtifacts.length > 0 && (
                <div>
                     <h2 className="text-lg font-semibold mb-2 mt-8">Available Artifacts</h2>
                     <div className="space-y-2">
                        {otherArtifacts.map(artifact => (
                            <div key={artifact.id} className="p-3 bg-muted/50 rounded-md hover:bg-muted flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 border">
                                <div className="flex items-center gap-3">
                                    <Package className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="font-semibold">{artifact.name}</p>
                                        <p className="text-sm text-muted-foreground font-mono">{artifact.id}</p>
                                    </div>
                                </div>
                                <Button onClick={() => handleSelectArtifact(artifact.id)} size="sm" disabled={isSwitching === artifact.id}>
                                     {isSwitching === artifact.id ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <ArrowRight className="mr-2 h-4 w-4" />
                                    )}
                                    Select
                                </Button>
                            </div>
                        ))}
                     </div>
                </div>
            )}
             {allArtifacts.length === 0 && (
                <Card>
                    <CardContent className="p-6 text-center">
                        <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No artifacts found for your account.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}


export default function SwitchPage() {
    usePageTitle('Switch Artifact');
    const { loading: profileLoading } = useProfile();
    
    return (
        <div className="w-full">
            <header className="mb-8">
                     <h1 className="text-3xl font-bold font-headline">Switch Artifact</h1>
                <p className="text-muted-foreground">
                         Choose an artifact to continue working on.
                </p>
            </header>

            {profileLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-16 w-full" />
                </div>
            ) : (
                <ArtifactList />
            )}
        </div>
    );
}
