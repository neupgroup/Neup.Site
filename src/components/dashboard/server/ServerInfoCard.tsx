
'use client';
import { useState, useTransition } from 'react';
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

interface ServerInfoCardProps {
    server: Server;
    initialUptime: string | null;
    initialStorage: { used: string, total: string, unit: string } | null;
    initialMemory: { used: number, total: number, unit: string } | null;
}

const DetailItem = ({ icon: Icon, label, children }: { icon: React.ElementType, label: string, children: React.ReactNode }) => (
    <div>
        <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2"><Icon className="h-4 w-4" />{label}</h4>
        <div className="text-sm">{children}</div>
    </div>
);

export default function ServerInfoCard({ server: initialServer, initialUptime, initialStorage, initialMemory }: ServerInfoCardProps) {
    const [server, setServer] = useState(initialServer);
    const [uptime, setUptime] = useState(initialUptime);
    const [storage, setStorage] = useState(initialStorage);
    const [memory, setMemory] = useState(initialMemory);
    const [showRebootConfirm, setShowRebootConfirm] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

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

    const handleReboot = async () => {
        setShowRebootConfirm(false);
        startTransition(async () => {
            await runCommand(server.id, 'sudo reboot');
            toast({ title: "Reboot Command Sent", description: `The server is now rebooting. This may take a few minutes.` });
        });
    };

    const resolvedAppPath = server.appPath?.replace(/\{\{universal\.site_id\}\}/g, site?.id || '') || 'N/A';

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>{server.name}</CardTitle>
                            <CardDescription>ID: {server.id}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
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
                            <p>{server.provider || 'N/A'}</p>
                        </DetailItem>
                        <DetailItem icon={User} label="Default Username">
                           <p className="font-mono">{server.username || 'N/A'}</p>
                        </DetailItem>
                        <DetailItem icon={Folder} label="Base Path">
                           <p className="font-mono">{server.basePath || 'N/A'}</p>
                        </DetailItem>
                         <DetailItem icon={Folder} label="App Path">
                           <p className="font-mono">{resolvedAppPath}</p>
                        </DetailItem>
                        <DetailItem icon={Clock} label="Uptime">
                           <p>{uptime || 'N/A'}</p>
                        </DetailItem>
                         <DetailItem icon={HardDrive} label="Storage">
                           <Link href={`/root/servers/${server.id}/storage`} className="hover:underline text-primary">
                             {storage ? `${storage.used}${storage.unit} / ${storage.total}${storage.unit}` : 'Click to view'}
                           </Link>
                        </DetailItem>
                        <DetailItem icon={Cpu} label="Processes (RAM)">
                           <Link href={`/root/servers/${server.id}/processes`} className="hover:underline text-primary">
                             {memory ? `${memory.used}${memory.unit} / ${memory.total}${memory.unit}` : 'Click to view'}
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
