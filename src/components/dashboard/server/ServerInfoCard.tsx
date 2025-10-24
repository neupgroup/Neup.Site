'use client';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Server as ServerIcon, Globe, Warehouse, User, Folder, HardDrive, Share2, ServerCrash, RefreshCw, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

import type { Server } from '@/schemas/server';
import { runCommand } from '@/actions/runner';
import { getStorageUsage } from '@/actions/server/management/get-storage-usage';

interface ServerInfoCardProps {
    server: Server;
    uptime: string | null;
}

export default function ServerInfoCard({ server: initialServer, uptime }: ServerInfoCardProps) {
    const [server, setServer] = useState(initialServer);
    const [showRebootConfirm, setShowRebootConfirm] = useState(false);
    const [isRefreshingStorage, setIsRefreshingStorage] = useState(false);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const router = useRouter();

    const handleRefreshStorage = async () => {
        setIsRefreshingStorage(true);
        const result = await getStorageUsage(server.id);
        if (result.success && result.data) {
            setServer(prev => prev ? {
                ...prev,
                storageUsed: result.data!.used,
                storageTotal: result.data!.total,
                storageUnit: result.data!.unit,
            } : null);
            toast({ title: "Storage Refreshed" });
        } else {
            toast({ variant: 'destructive', title: "Failed to Refresh Storage", description: result.error });
        }
        setIsRefreshingStorage(false);
    };

    const handleReboot = async () => {
        setShowRebootConfirm(false);
        startTransition(async () => {
            await runCommand(server.id, 'reboot');
            toast({ title: "Reboot Command Sent", description: `The server is now rebooting. This may take a few minutes.` });
        });
    };

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
                            {uptime && <Badge variant="secondary">{uptime}</Badge>}
                            {server.isPrivate && <Badge variant="secondary">Private</Badge>}
                            {server.serverType && <Badge variant="outline" className="capitalize">{server.serverType}</Badge>}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                            <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2"><Globe className="h-4 w-4" />Public IP</h4>
                            <a href={`http://${server.publicIp}`} target="_blank" rel="noopener noreferrer" className="font-mono text-sm hover:underline">
                                {server.publicIp}
                            </a>
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2"><Warehouse className="h-4 w-4" />Provider</h4>
                            <p className="text-sm">{server.provider || 'N/A'}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm text-muted-foreground">Created On</h4>
                            <p className="text-sm">{server.createdOn ? new Date(server.createdOn).toLocaleString() : 'N/A'}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2"><User className="h-4 w-4" />Default Username</h4>
                            <p className="font-mono text-sm">{server.username || 'N/A'}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2"><Folder className="h-4 w-4" />Default Base Path</h4>
                            <p className="font-mono text-sm">{server.basePath || 'N/A'}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2"><HardDrive className="h-4 w-4" />Storage</h4>
                            <div className="flex items-center gap-2">
                                <p className="font-mono text-sm">
                                    {server.storageUsed && server.storageTotal
                                        ? `${server.storageUsed}${server.storageUnit} / ${server.storageTotal}${server.storageUnit}`
                                        : 'N/A'}
                                </p>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleRefreshStorage} disabled={isRefreshingStorage}>
                                    {isRefreshingStorage ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    </div>
                    {server.usedPorts && server.usedPorts.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-sm text-muted-foreground">Used Ports (from DB)</h4>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {server.usedPorts.map(p => <Badge key={p.port} variant="secondary">{p.port}: {p.description}</Badge>)}
                            </div>
                        </div>
                    )}
                    {server.expiresOn && (
                        <div>
                            <h4 className="font-semibold text-sm text-muted-foreground">Expires On</h4>
                            <p className="text-sm">{new Date(server.expiresOn).toLocaleString()}</p>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                    <div className="flex gap-2">
                        <Button asChild variant="outline">
                            <Link href={`/root/servers/allocations/create?serverId=${server.id}`}>
                                <Share2 className="mr-2 h-4 w-4" /> Allocate Server
                            </Link>
                        </Button>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="destructive" onClick={() => setShowRebootConfirm(true)}>
                            <ServerCrash className="mr-2 h-4 w-4" /> Reboot Server
                        </Button>
                    </div>
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
