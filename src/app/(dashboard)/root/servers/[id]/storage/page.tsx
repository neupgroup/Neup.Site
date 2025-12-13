
'use client';
import { useCallback, useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { getDetailedStorageForServer, type DetailedStorageInfo } from '@/actions/server/management/get-detailed-storage-for-server';
import { Progress } from '@/components/ui/progress';
import { Server as ServerIcon, User, Folder as FolderIcon } from 'lucide-react';
import FileManager from '@/components/dashboard/server/FileManager';

const StorageAnalysis = ({ serverId }: { serverId: string }) => {
    const [storageInfo, setStorageInfo] = useState<DetailedStorageInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStorage = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        const result = await getDetailedStorageForServer(serverId);
        if (result.success && result.data) {
            setStorageInfo(result.data);
        } else {
            setError(result.error || 'Failed to fetch storage info.');
        }
        setIsLoading(false);
    }, [serverId]);

    useEffect(() => {
        fetchStorage();
    }, [fetchStorage]);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Storage Analysis</CardTitle>
                    <CardDescription>A detailed breakdown of disk usage.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-full" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Loading Storage Analysis</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    if (!storageInfo) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Storage Analysis</CardTitle>
                <CardDescription>A detailed breakdown of disk usage.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                        <p className="text-sm font-medium">{storageInfo.total.usePercentage} Used</p>
                        <p className="text-sm text-muted-foreground">{storageInfo.total.used} of {storageInfo.total.size}</p>
                    </div>
                    <Progress value={parseInt(storageInfo.total.usePercentage)} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg border bg-muted/30">
                        <h4 className="font-semibold flex items-center gap-2"><ServerIcon className="h-4 w-4" /> System</h4>
                        <p className="text-2xl font-bold">{storageInfo.system.used}</p>
                        <p className="text-xs text-muted-foreground">OS & other files</p>
                    </div>
                    <div className="p-4 rounded-lg border bg-muted/30">
                        <h4 className="font-semibold flex items-center gap-2"><FolderIcon className="h-4 w-4" /> Swap</h4>
                        <p className="text-2xl font-bold">{storageInfo.swap.used}</p>
                        <p className="text-xs text-muted-foreground">{storageInfo.swap.total} Total</p>
                    </div>
                    {storageInfo.users.map(user => (
                        <div key={user.name} className="p-4 rounded-lg border bg-muted/30">
                            <h4 className="font-semibold flex items-center gap-2"><User className="h-4 w-4" /> {user.name}</h4>
                            <p className="text-2xl font-bold">{user.used}</p>
                            <p className="text-xs text-muted-foreground">in /home/{user.name}</p>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};


export default function StoragePage() {
    const params = useParams<{ id: string }>();

    return (
        <div className="space-y-6">
             <header className="flex items-center justify-between mb-8">
                <h1 className="font-headline text-2xl font-semibold tracking-tight">Storage & File Manager</h1>
                <p className="text-muted-foreground">Manage files and view disk usage for this server.</p>
            </header>
            <FileManager serverId={params.id} />
            <Separator />
            <StorageAnalysis serverId={params.id} />
        </div>
    );
};
