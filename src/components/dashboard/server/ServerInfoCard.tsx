
'use client';
import { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Server as ServerIcon, Globe, Warehouse, User, Folder, HardDrive, Share2, ServerCrash, RefreshCw, Loader2, Clock, ListTree, Wifi, Cpu } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useProfile } from '@/context/ProfileContext';

import type { Server } from '@/schemas/server';
import { runCommand } from '@/actions/runner';
import { getUptime } from '@/actions/server/management/get-uptime';
import { getStorageUsage } from '@/actions/server/management/get-storage-usage';
import { getMemoryUsage } from '@/actions/server/management/get-memory-usage';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

interface ServerInfoCardProps {
    server: Server;
}

const DetailItem = ({ icon: Icon, label, children }: { icon: React.ElementType, label: string, children: React.ReactNode }) => (
    <div>
        <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2"><Icon className="h-4 w-4" />{label}</h4>
        <div className="text-sm">{children}</div>
    </div>
);

const ServerInfoCard = ({ server: initialServer }: ServerInfoCardProps) => {
    const [server] = useState(initialServer);
    const [uptime, setUptime] = useState<string | null>(null);
    const [storage, setStorage] = useState<{ used: string, total: string, unit: string } | null>(null);
    const [memory, setMemory] = useState<{ used: number, total: number, unit: string } | null>(null);
    const [showRebootConfirm, setShowRebootConfirm] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(true);

    const { site } = useProfile();
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const router = useRouter();

    const handleRefreshAll = async () => {
        setIsRefreshing(true);
        toast({ title: "Refreshing Server Data..." });

        const [uptimeResult, storageResult, memoryResult] = await Promise.all([
            getUptime(server.id),
            getStorageUsage(server.id),
            getMemoryUsage(server.id),
        ]);

        if (uptimeResult.success) setUptime(uptimeResult.uptime || null);
        if (storageResult.success) setStorage(storageResult.data || null);
        if (memoryResult.success) setMemory(memoryResult.data || null);

        if (!uptimeResult.success || !storageResult.success || !memoryResult.success) {
            toast({ variant: 'destructive', title: "Failed to Refresh Some Data" });
        } else {
            toast({ title: "Server Data Refreshed" });
        }
        setIsRefreshing(false);
    }
    
    useEffect(() => {
        handleRefreshAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [server.id]);

    const handleReboot = async () => {
        setShowRebootConfirm(false);
        startTransition(async () => {
            await runCommand(server.id, 'sudo reboot', {}, 'Reboot Server');
            toast({ title: "Reboot Command Sent", description: `The server is now rebooting. This may take a few minutes.` });
        });
    };

    const resolvedAppPath = server.appPath?.replace(/\{\{\s*universal\.site_id\s*\}\}/g, site?.id || '') || 'N/A';

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div className="min-w-0">
                            <CardTitle className="truncate">{server.name}</CardTitle>
                            <CardDescription className="truncate">ID: {server.id}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {server.isPrivate && <Badge variant="secondary">Private</Badge>}
                            {server.serverType && <Badge variant="outline" className="capitalize">{server.serverType}</Badge>}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <DetailItem icon={Globe} label="Public IP">
                            <a href={`http://${server.publicIp}`} target="_blank" rel="noopener noreferrer" className="font-mono hover:underline">
                                {server.publicIp}
                            </a>
                        </DetailItem>
                        <DetailItem icon={Warehouse} label="Provider">
                            <p className="truncate">{server.provider || 'N/A'}</p>
                        </DetailItem>
                        <DetailItem icon={User} label="Default Username">
                           <p className="font-mono truncate">{server.username || 'N/A'}</p>
                        </DetailItem>
                        <DetailItem icon={Folder} label="Base Path">
                           <Link href={`/root/servers/${server.id}/files?path=${encodeURIComponent(server.basePath || '/')}`} className="font-mono hover:underline text-primary truncate block">
                                {server.basePath || 'N/A'}
                           </Link>
                        </DetailItem>
                         <DetailItem icon={Folder} label="App Path">
                           <Link href={`/root/servers/${server.id}/files?path=${encodeURIComponent(resolvedAppPath)}`} className="font-mono hover:underline text-primary truncate block">
                                {resolvedAppPath}
                           </Link>
                        </DetailItem>
                         <DetailItem icon={Clock} label="Uptime">
                           {isRefreshing ? <Skeleton className="h-5 w-32 mt-1"/> : <p className="truncate">{uptime || 'N/A'}</p>}
                        </DetailItem>
                         <DetailItem icon={HardDrive} label="Storage">
                           <Link href={`/root/servers/${server.id}/storage`} className="hover:underline text-primary">
                             {isRefreshing ? <Skeleton className="h-5 w-24 mt-1"/> : (storage ? `${storage.used}${storage.unit} / ${storage.total}${storage.unit}` : 'Click to view')}
                           </Link>
                        </DetailItem>
                        <DetailItem icon={Cpu} label="Processes (RAM)">
                           <Link href={`/root/servers/${server.id}/processes`} className="hover:underline text-primary">
                            {isRefreshing ? <Skeleton className="h-5 w-24 mt-1"/> : (memory ? `${memory.used}${memory.unit} / ${memory.total}${memory.unit}` : 'Click to view')}
                           </Link>
                        </DetailItem>
                         <DetailItem icon={Wifi} label="Network">
                           <Link href={`/root/servers/${server.id}/network`} className="hover:underline text-primary">
                            View active connections
                           </Link>
                        </DetailItem>
                    </div>
                    
                    {server.expiresOn && (
                        <div>
                            <h4 className="font-semibold text-sm text-muted-foreground">Expires On</h4>
                            <p className="text-sm">{new Date(server.expiresOn).toLocaleString()}</p>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={handleRefreshAll} disabled={isRefreshing}>
                        {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        Refresh Stats
                    </Button>
                    <Button asChild variant="outline" size="sm">
                        <Link href={`/root/servers/allocations/create?serverId=${server.id}`}>
                            <Share2 className="mr-2 h-4 w-4" /> Allocate Server
                        </Link>
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setShowRebootConfirm(true)} disabled={isPending}>
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ServerCrash className="mr-2 h-4 w-4" />}
                        Reboot Server
                    </Button>
                </CardFooter>
            </Card>

            <AlertDialog open={showRebootConfirm} onOpenChange={setShowRebootConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will restart the server. Any unsaved work on running applications may be lost.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleReboot}>Reboot</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

const DetailItemSkeleton = ({ icon: Icon, label, skeletonWidth = 'w-32' }: { icon: React.ElementType, label: string, skeletonWidth?: string }) => (
    <div>
        <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2"><Icon className="h-4 w-4" />{label}</h4>
        <Skeleton className={`h-5 mt-1 ${skeletonWidth}`} />
    </div>
);

ServerInfoCard.Skeleton = function ServerInfoCardSkeleton() {
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <Skeleton className="h-8 w-48 mb-2" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-20" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-4 border-t">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <DetailItemSkeleton icon={Globe} label="Public IP" skeletonWidth="w-36" />
                    <DetailItemSkeleton icon={Warehouse} label="Provider" />
                    <DetailItemSkeleton icon={User} label="Default Username" skeletonWidth="w-24"/>
                    <DetailItemSkeleton icon={Folder} label="Base Path" />
                    <DetailItemSkeleton icon={Folder} label="App Path" />
                    <DetailItemSkeleton icon={Clock} label="Uptime" />
                    <DetailItemSkeleton icon={HardDrive} label="Storage" />
                    <DetailItemSkeleton icon={Cpu} label="Processes (RAM)" />
                    <DetailItemSkeleton icon={Wifi} label="Network" />
                </div>
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2">
                <Skeleton className="h-9 w-36" />
                <Skeleton className="h-9 w-40" />
                <Skeleton className="h-9 w-36" />
            </CardFooter>
        </Card>
    )
}

export default ServerInfoCard;

    