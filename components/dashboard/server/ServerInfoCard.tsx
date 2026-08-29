
'use client';
import { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '#/components/ui/card';
import { Button } from '#/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '#/components/ui/alert-dialog';
import { Server as ServerIcon, Globe, Warehouse, User, Share2, ServerCrash, RefreshCw, Loader2, Clock } from 'lucide-react';
import { Badge } from '#/components/ui/badge';
import { useToast } from '#/core/hooks/useToast';
import { useRouter } from 'next/navigation';

import type { Server } from '@/services/server/type';
import { runCommand } from '@/services/runner';
import { getUptime } from '@/services/server/management/get-uptime';
import { Skeleton } from '#/components/ui/skeleton';

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
    const [showRebootConfirm, setShowRebootConfirm] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(true);

    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const router = useRouter();

    const handleRefreshAll = async () => {
        setIsRefreshing(true);
        toast({ title: "Refreshing Server Data..." });

        const [uptimeResult] = await Promise.all([
            getUptime(server.id),
        ]);

        if (uptimeResult.success) setUptime(uptimeResult.uptime || null);

        if (!uptimeResult.success) {
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
            const result = await runCommand(server.id, 'nohup sudo shutdown -r +1 &', {}, 'Reboot Server');
            if (result.success) {
                toast({ title: "Reboot Scheduled", description: `The server will reboot in 1 minute. This allows the command to complete successfully.` });
            } else {
                toast({ variant: "destructive", title: "Reboot Failed", description: result.error || "Failed to schedule server reboot." });
            }
        });
    };

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
                        <DetailItem icon={Clock} label="Uptime">
                            {isRefreshing ? <Skeleton className="h-5 w-32 mt-1" /> : <p className="truncate">{uptime || 'N/A'}</p>}
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
                    <Button type="outlined" size="sm" onClick={handleRefreshAll} disabled={isRefreshing}>
                        {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        Refresh Stats
                    </Button>
                    <Button asChild type="outlined" size="sm">
                        <Link href={`/root/servers/allocations/create?serverId=${server.id}`}>
                            <Share2 className="mr-2 h-4 w-4" /> Allocate Server
                        </Link>
                    </Button>
                    <Button type="solid" convey="danger" size="sm" onClick={() => setShowRebootConfirm(true)} disabled={isPending}>
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ServerCrash className="mr-2 h-4 w-4" />}
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
                    <DetailItemSkeleton icon={User} label="Default Username" skeletonWidth="w-24" />
                    <DetailItemSkeleton icon={Clock} label="Uptime" />
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
