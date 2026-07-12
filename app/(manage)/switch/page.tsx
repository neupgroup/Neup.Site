
'use client';

import { useState, useEffect } from 'react';
import { getAssetsForAccount, createAssetForAccount, type AssetSummary } from '@/services/assets';
import { setAssetIdCookie } from '@/services/auth';
import { useToast } from '@/core/hooks/use-toast';
import { useProfile } from '@/inapp/context/profilecontext';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { AlertCircle, Package, Loader2, ArrowRight, CheckCircle, Plus } from 'lucide-react';
import { getCookie } from '@/inapp/helpers/session-manager';
import { usePageTitle } from '@/core/hooks/use-page-title';

function AssetList() {
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

    useEffect(() => {
        const fetchAssets = async () => {
            setLoading(true);
            const { assets, error } = await getAssetsForAccount();
            if (error) {
                setError(error);
            } else {
                setAllAssets(assets || []);
                setActiveAssetId(getCookie('assetId'));
            }
            setLoading(false);
        };
        fetchAssets();
    }, []);

    const handleSelectAsset = async (assetId: string) => {
        setIsSwitching(assetId);
        const result = await setAssetIdCookie(assetId);
        if (result.success) {
            toast({ title: 'Asset Switched', description: `You are now working on asset: ${assetId}.` });
            setActiveAssetId(assetId);
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
        setIsSwitching(null);
    };

    const handleCreateAsset = async () => {
        if (!createForm.name.trim()) {
            toast({ variant: 'destructive', title: 'Missing name', description: 'Asset name is required.' });
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
                    <CardTitle>Create Asset</CardTitle>
                    <CardDescription>Start a new asset for your account.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Name</label>
                        <Input
                            value={createForm.name}
                            onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
                            placeholder="Asset name"
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
                        Create Asset
                    </Button>
                </CardFooter>
            </Card>

            {currentAsset && (
                <div>
                    <h2 className="text-lg font-semibold mb-2">Current Asset</h2>
                    <div className="p-3 bg-primary/10 rounded-md flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 border-2 border-primary">
                        <div className="flex items-center gap-3">
                            <Package className="h-5 w-5 text-primary" />
                            <div>
                                <p className="font-semibold">{currentAsset.name}</p>
                                <p className="text-sm text-muted-foreground font-mono">{currentAsset.id}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-green-600">
                           <CheckCircle className="h-5 w-5" />
                           <span className="font-semibold">Selected</span>
                        </div>
                    </div>
                </div>
            )}

            {otherAssets.length > 0 && (
                <div>
                     <h2 className="text-lg font-semibold mb-2 mt-8">Available Assets</h2>
                     <div className="space-y-2">
                        {otherAssets.map(asset => (
                            <div key={asset.id} className="p-3 bg-muted/50 rounded-md hover:bg-muted flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 border">
                                <div className="flex items-center gap-3">
                                    <Package className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="font-semibold">{asset.name}</p>
                                        <p className="text-sm text-muted-foreground font-mono">{asset.id}</p>
                                    </div>
                                </div>
                                <Button variant="primary" onClick={() => handleSelectAsset(asset.id)} size="sm" disabled={isSwitching === asset.id}>
                                     {isSwitching === asset.id ? (
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
             {allAssets.length === 0 && (
                <Card>
                    <CardContent className="p-6 text-center">
                        <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No assets found for your account.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}


export default function SwitchPage() {
    usePageTitle('Switch Asset');
    const { loading: profileLoading } = useProfile();
    
    return (
        <div className="w-full">
            <header className="mb-8">
                     <h1 className="text-3xl font-bold font-headline">Switch Asset</h1>
                <p className="text-muted-foreground">
                         Choose an asset to continue working on.
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
