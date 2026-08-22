
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { getAssetsForAccount, createAssetForAccount, type AssetSummary } from '@/services/assets';
import { useToast } from '@/core/hooks/use-toast';
import { clearSession } from '@/inapp/helpers/session-manager';
import { useProfile } from '@/inapp/context/ProfileContext';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { AlertCircle, Loader2, ArrowRight, CheckCircle, Plus, ChevronRight, Package } from 'lucide-react';
import { usePageTitle } from '@/core/hooks/use-page-title';

function ProjectRow({
    asset,
    isSelected = false,
    isLoading = false,
    onSelect,
    className = '',
}: {
    asset: AssetSummary;
    isSelected?: boolean;
    isLoading?: boolean;
    onSelect?: (assetId: string) => void;
    className?: string;
}) {
    return (
        <div
            className={[
                'block w-full border p-4 transition-colors',
                isSelected ? 'border-primary bg-primary/10' : 'hover:bg-muted/90',
                className,
            ].join(' ')}
        >
            <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Avatar className="h-12 w-12 rounded-[1rem]">
                            {asset.logoUrl ? <AvatarImage src={asset.logoUrl} alt={asset.name} /> : null}
                            <AvatarFallback className="rounded-[1rem] bg-muted">
                                <Image src="/logo.svg" alt="Neup.Sites" width={24} height={24} className="h-6 w-6" />
                            </AvatarFallback>
                        </Avatar>
                    </div>
                    <div className="min-w-0 space-y-1">
                        <h3 className="text-base font-semibold">{asset.name}</h3>
                        <p className="text-sm text-muted-foreground font-mono">{asset.id}</p>
                    </div>
                </div>
                {isSelected ? (
                    <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-semibold">Selected</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <Button variant="secondary" onClick={() => onSelect?.(asset.id)} size="sm" disabled={isLoading}>
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <ArrowRight className="mr-2 h-4 w-4" />
                            )}
                            Select
                        </Button>
                        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                    </div>
                )}
            </div>
        </div>
    );
}

function AssetList() {
    const searchParams = useSearchParams();
    const [allAssets, setAllAssets] = useState<AssetSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSwitching, setIsSwitching] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [activeAssetId, setActiveAssetId] = useState<string | null>(null);
    const [createForm, setCreateForm] = useState({
        name: '',
    });

    const { toast } = useToast();
    const selectedProjectId = searchParams.get('selectedProject');
    const returnTo = searchParams.get('returnTo') || '/';

    useEffect(() => {
        const fetchAssets = async () => {
            setLoading(true);
            const { assets, error } = await getAssetsForAccount();
            if (error) {
                setError(error);
            } else {
                setAllAssets(assets || []);
            }
            setLoading(false);
        };
        fetchAssets();
    }, []);

    useEffect(() => {
        setActiveAssetId(selectedProjectId);
    }, [selectedProjectId]);

    const getProjectDestination = (assetId: string) => {
        const destination = new URL(returnTo, window.location.origin);

        if (destination.pathname === '/switch') {
            destination.pathname = '/';
            destination.search = '';
        }

        destination.searchParams.set('selectedProject', assetId);
        return `${destination.pathname}${destination.search}${destination.hash}`;
    };

    const handleSelectAsset = async (assetId: string) => {
        setIsSwitching(assetId);
        setActiveAssetId(assetId);
        clearSession();
        window.location.assign(getProjectDestination(assetId));
    };

    const handleCreateAsset = async () => {
        if (!createForm.name.trim()) {
            toast({ variant: 'destructive', title: 'Missing name', description: 'Project name is required.' });
            return;
        }

        setIsCreating(true);
        const result = await createAssetForAccount({
            name: createForm.name,
        });

        if (result.success && result.asset) {
            setAllAssets((prev) => [result.asset!, ...prev]);
            setCreateForm({ name: '' });
            await handleSelectAsset(result.asset.id);
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }

        setIsCreating(false);
    };

    const otherAssets = allAssets.filter(asset => asset.id !== activeAssetId);
    const currentAsset = allAssets.find(asset => asset.id === activeAssetId);

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
                    <CardTitle>Create Project</CardTitle>
                    <CardDescription>Start a new project for your account.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Name</label>
                        <Input
                            value={createForm.name}
                            onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
                            placeholder="Project name"
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button variant="primary" onClick={handleCreateAsset} disabled={isCreating}>
                        {isCreating ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Plus className="mr-2 h-4 w-4" />
                        )}
                        Create Project
                    </Button>
                </CardFooter>
            </Card>

            {currentAsset && (
                <div>
                    <h2 className="text-lg font-semibold mb-2">Current Project</h2>
                    <ProjectRow asset={currentAsset} isSelected />
                </div>
            )}

            {otherAssets.length > 0 && (
                <div>
                     <h2 className="text-lg font-semibold mb-2 mt-8">Available Projects</h2>
                     <div className="space-y-0">
                        {otherAssets.map((asset, index) => {
                            const isFirst = index === 0;
                            const isLast = index === otherAssets.length - 1;

                            return (
                                <ProjectRow
                                    key={asset.id}
                                    asset={asset}
                                    isLoading={isSwitching === asset.id}
                                    onSelect={handleSelectAsset}
                                    className={[
                                        isFirst ? 'rounded-t-md' : 'rounded-t-none',
                                        isLast ? 'rounded-b-md' : 'rounded-b-none',
                                        !isLast ? 'border-b-0' : '',
                                    ].join(' ')}
                                />
                            );
                        })}
                     </div>
                </div>
            )}
             {allAssets.length === 0 && (
                <Card>
                    <CardContent className="p-6 text-center">
                        <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No projects found for your account.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}


export default function SwitchPage() {
    usePageTitle('Switch Project');
    const { loading: profileLoading } = useProfile();
    
    return (
        <div className="w-full">
            <header className="mb-8">
                     <h1 className="text-3xl font-bold font-headline">Switch Project</h1>
                <p className="text-muted-foreground">
                         Choose a project to continue working on.
                </p>
            </header>

            {profileLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-16 w-full" />
                </div>
            ) : (
                <AssetList />
            )}
        </div>
    );
}
