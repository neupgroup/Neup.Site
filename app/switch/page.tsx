
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAssetsForAccount, setDefaultProjectForAccount, type AssetSummary } from '@/services/assets';
import { useToast } from '@neup/core/hooks/useToast';
import { clearSession } from '@/inapp/helpers/session-manager';
import { useProfile } from '@/inapp/context/ProfileContext';

import { Avatar, AvatarFallback, AvatarImage } from '@neup/components/ui/avatar';
import { Skeleton } from '@neup/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@neup/components/ui/alert';
import { AlertCircle, Plus } from 'lucide-react';
import { usePageTitle } from '@neup/core/hooks/use-page-title';

function ProjectRow({
    asset,
    isSelected = false,
    onSelect,
    href,
    className = '',
}: {
    asset: AssetSummary;
    isSelected?: boolean;
    onSelect?: (assetId: string) => void;
    href?: string;
    className?: string;
}) {
    return (
        <div
            className={[
                'block w-full cursor-pointer border p-4 transition-colors hover:bg-muted/90',
                className,
            ].join(' ')}
            onClick={() => onSelect?.(asset.id)}
            role="link"
            tabIndex={0}
        >
            <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Avatar className="h-12 w-12 rounded-[1rem]">
                            {asset.logoUrl ? <AvatarImage src={asset.logoUrl} alt={asset.name} /> : null}
                            <AvatarFallback className="rounded-[1rem] bg-muted">
                                <Image src="@neup/logo.svg" alt="Neup.Sites" width={24} height={24} className="h-6 w-6" />
                            </AvatarFallback>
                        </Avatar>
                    </div>
                    <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-semibold">{asset.name}</h3>
                            {isSelected && (
                                <div className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                    Selected
                                </div>
                            )}
                            {asset.isDefault && (
                                <div className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                    Default
                                </div>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground font-mono">{asset.id}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function AssetList() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [allAssets, setAllAssets] = useState<AssetSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeAssetId, setActiveAssetId] = useState<string | null>(null);

    const { toast } = useToast();
    const projectId = searchParams.get('project');

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
        setActiveAssetId(projectId);
    }, [projectId]);

    const getProjectDestination = (assetId: string) => {
        const destination = new URL('/switch', window.location.origin);
        destination.searchParams.set('project', assetId);
        return `${destination.pathname}${destination.search}`;
    };

    const prepareProjectSelection = (assetId: string) => {
        setActiveAssetId(assetId);

        toast({
            name: 'project-switch',
            state: 'info',
            convey: 'info',
            title: 'Switching project',
            description: 'Loading the selected project...',
            dismissesOn: 2,
        });

        clearSession();
    };

    const handleSelectAsset = async (assetId: string) => {
        if (assetId === projectId) {
            const result = await setDefaultProjectForAccount(assetId);
            if (result.success) {
                setAllAssets((prev) => prev.map((asset) => ({
                    ...asset,
                    isDefault: asset.id === assetId,
                })));
            }
            toast({
                variant: result.success ? 'default' : 'destructive',
                title: result.success ? 'Default project saved' : 'Unable to save default project',
                description: result.success ? 'This project will open by default.' : result.error,
            });
            return;
        }

        prepareProjectSelection(assetId);
        router.replace(getProjectDestination(assetId));
    };

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
            <div>
                    <Link
                        href="/switch/new"
                        className={[
                            'flex w-full items-center gap-3 border p-4 transition-colors hover:bg-muted/90',
                            allAssets.length > 0 ? 'rounded-t-md border-b-0' : 'rounded-md',
                        ].join(' ')}
                    >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted">
                            <Plus className="h-6 w-6 text-primary" />
                        </div>
                        <div className="min-w-0 space-y-1">
                            <h3 className="text-base font-semibold">New Project</h3>
                            <p className="text-sm text-muted-foreground">Create a new project.</p>
                        </div>
                    </Link>
                    {allAssets.length > 0 && <div className="space-y-0">
                        {allAssets.map((asset, index) => {
                            const isLast = index === allAssets.length - 1;

                            return (
                                <ProjectRow
                                    key={asset.id}
                                    asset={asset}
                                    isSelected={asset.id === activeAssetId}
                                    href={getProjectDestination(asset.id)}
                                    onSelect={handleSelectAsset}
                                    className={[
                                        'rounded-t-none',
                                        isLast ? 'rounded-b-md' : 'rounded-b-none',
                                        !isLast ? 'border-b-0' : '',
                                    ].join(' ')}
                                />
                            );
                        })}
                    </div>}
            </div>
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
