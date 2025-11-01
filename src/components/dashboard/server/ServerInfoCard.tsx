
'use client';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Server as ServerIcon, Globe, Warehouse, User, Folder, HardDrive, Share2, ServerCrash, RefreshCw, Loader2, Clock, ListTree, Wifi } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

import type { Server } from '@/schemas/server';
import { runCommand } from '@/actions/runner';
import { getUptime } from '@/actions/server/management/get-uptime';
import { Separator } from '@/components/ui/separator';

interface ServerInfoCardProps {
    server: Server;
    initialUptime: string | null;
}

const statusSections = [
    { title: 'Storage & Files', href: 'storage', description: 'View disk usage and browse files.', icon: HardDrive },
    { title: 'Network', href: 'network', description: 'See active ports and listening services.', icon: Wifi },
    { title: 'Processes', href: 'processes', description: 'Browse system processes and PM2 apps.', icon: ListTree },
];


export default function ServerInfoCard({ server: initialServer, initialUptime }: ServerInfoCardProps) {
    const [server, setServer] = useState(initialServer);
    const [uptime, setUptime] = useState(initialUptime);
    const [showRebootConfirm, setShowRebootConfirm] = useState(false);
    const [isRefreshingUptime, setIsRefreshingUptime] = useState(false);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const router = useRouter();

    const handleRefreshUptime = async () => {
        setIsRefreshingUptime(true);
        const result = await getUptime(server.id);
        if (result.success && result.uptime) {
            setUptime(result.uptime);
            toast({ title: "Uptime Refreshed" });
        } else {
            toast({ variant: 'destructive', title: "Failed to Refresh Uptime", description: result.error });
        }
        setIsRefreshingUptime(false);
    }

    const handleReboot = async () => {
        setShowRebootConfirm(false);
        startTransition(async () => {
            await runCommand(server.id, 'sudo reboot');
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
                            <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2"><Clock className="h-4 w-4" />Uptime</h4>
                            <div className="flex items-center gap-2">
                                <p className="text-sm">{uptime || 'N/A'}</p>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleRefreshUptime} disabled={isRefreshingUptime}>
                                    {isRefreshingUptime ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    </div>
                    
                    {server.expiresOn && (
                        <div>
                            <h4 className="font-semibold text-sm text-muted-foreground">Expires On</h4>
                            <p className="text-sm">{new Date(server.expiresOn).toLocaleString()}</p>
                        </div>
                    )}
                    <Separator />
                     <div>
                        <h3 className="text-base font-semibold mb-4">Server Status & Management</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {statusSections.map(section => (
                                <Link key={section.href} href={`/root/servers/${server.id}/${section.href}`} className="block">
                                    <div className="p-4 border rounded-lg hover:bg-muted/50 hover:border-primary transition-all h-full">
                                        <div className="flex items-center gap-2">
                                            <section.icon className="h-5 w-5 text-muted-foreground" />
                                            <h4 className="font-semibold">{section.title}</h4>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-wrap gap-2">
                    <Button asChild variant="outline">
                        <Link href={`/root/servers/allocations/create?serverId=${server.id}`}>
                            <Share2 className="mr-2 h-4 w-4" /> Allocate Server
                        </Link>
                    </Button>
                    <Button variant="destructive" onClick={() => setShowRebootConfirm(true)}>
                        <ServerCrash className="mr-2 h-4 w-4" /> Reboot Server
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
