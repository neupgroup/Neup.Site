
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { ServerCommand } from '@/actions/commands';
import { getServerCommands } from '@/actions/commands';
import { runCommand } from '@/actions/runner';

import { getConfigureNginxCommand } from '@/actions/server/management/configure-nginx';
import { getInstallCertbotNginxCommand } from '@/actions/server/management/install-certbot-nginx';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { Search, Loader2, Globe, Lock, Send, Terminal, Code, ChevronLeft, ChevronRight } from 'lucide-react';

const ManagementItem = ({ icon: Icon, title, description, onClick }: { icon: React.ElementType, title: string, description: string, onClick: () => void }) => (
    <div onClick={onClick} className="flex items-start gap-4 rounded-lg border p-4 hover:bg-muted/50 cursor-pointer transition-colors">
        <Icon className="h-6 w-6 text-muted-foreground mt-1" />
        <div className="flex-1">
            <h4 className="font-medium text-left">{title}</h4>
            <p className="text-sm text-muted-foreground text-left">{description}</p>
        </div>
    </div>
);


export default function ServerManagement({ serverId }: { serverId: string }) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    // State for dialogs
    const [customCommand, setCustomCommand] = useState('');
    const [isCustomCommandDialogOpen, setIsCustomCommandDialogOpen] = useState(false);
    
    const [isNginxDialogOpen, setIsNginxDialogOpen] = useState(false);
    const [nginxDomains, setNginxDomains] = useState('');
    const [proxyUrl, setProxyUrl] = useState('http://localhost:3000');

    const [isCertbotDialogOpen, setIsCertbotDialogOpen] = useState(false);
    const [certbotDomain, setCertbotDomain] = useState('');
    const [certbotEmail, setCertbotEmail] = useState('');
    
    // State for commands
    const [allCommands, setAllCommands] = useState<ServerCommand[]>([]);
    const [commandToRun, setCommandToRun] = useState<ServerCommand | null>(null);
    const [commandParams, setCommandParams] = useState<Record<string, string>>({});
    const [searchQuery, setSearchQuery] = useState('');
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;

    useEffect(() => {
        const fetchCommands = async () => {
            const result = await getServerCommands({ pageSize: 1000 }); // Fetch all
            if (result.success && result.commands) {
                setAllCommands(result.commands);
            }
        };
        fetchCommands();
    }, []);
    
    useEffect(() => {
        // Reset to first page when search query changes
        setCurrentPage(1);
    }, [searchQuery]);

    const handleRunCustomCommand = () => {
        if (!customCommand) return;
        startTransition(async () => {
            await runCommand(serverId, customCommand);
            toast({ title: "Custom Command Sent" });
            setCustomCommand('');
            setIsCustomCommandDialogOpen(false);
        });
    };

    const handleRunSavedCommand = () => {
        if (!commandToRun) return;

        startTransition(async () => {
            await runCommand(
                serverId,
                commandToRun.id,
                commandParams
            );
            toast({ title: "Command Sent", description: `The command "${commandToRun.name}" has been sent.` });
            
            setCommandToRun(null);
            setCommandParams({});
        });
    };
    
    const handleRunCommand = (command: string, description: string) => {
        startTransition(async () => {
            await runCommand(serverId, command);
            toast({ title: "Command Sent", description: `Running command: ${description}`});
        });
    }

    const handleNginxConfig = async () => {
        const urls = nginxDomains.split('\n').map(u => u.trim()).filter(Boolean);
        if (urls.length === 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'At least one domain is required.' });
            return;
        }

        try {
            const command = await getConfigureNginxCommand({ urls, proxyUrl, listenPort: 80 });
            handleRunCommand(command, `Configure Nginx for ${urls[0]}`);
            setIsNginxDialogOpen(false);
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Configuration Error', description: e.message });
        }
    };

    const handleInstallCertbot = async () => {
        try {
            const command = await getInstallCertbotNginxCommand({ domain: certbotDomain, email: certbotEmail });
            handleRunCommand(command, `Install SSL for ${certbotDomain}`);
            setIsCertbotDialogOpen(false);
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'SSL Setup Error', description: e.message });
        }
    };

    const staticManagementItems = [
        {
            title: 'Configure Nginx Reverse Proxy',
            description: 'Point domains/paths to a running application.',
            icon: Globe,
            onClick: () => setIsNginxDialogOpen(true),
        },
        {
            title: 'Setup SSL with Certbot',
            description: 'Install a free SSL certificate from Let\'s Encrypt.',
            icon: Lock,
            onClick: () => setIsCertbotDialogOpen(true),
        },
        {
            title: 'Run Custom Command',
            description: 'Execute any shell command on the server.',
            icon: Terminal,
            onClick: () => setIsCustomCommandDialogOpen(true),
        },
    ];

    const allManagementItems = [
        ...allCommands.map(cmd => ({
            id: cmd.id,
            title: cmd.name,
            description: cmd.description || 'No description',
            icon: Code,
            onClick: () => setCommandToRun(cmd),
        })),
        ...staticManagementItems.map(item => ({...item, id: item.title})),
    ];
    
    const filteredItems = allManagementItems.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const paginatedItems = filteredItems.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const totalPages = Math.ceil(filteredItems.length / pageSize);

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Server Management</CardTitle>
                    <CardDescription>Perform common server maintenance and setup tasks.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search commands..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        {paginatedItems.map(item => (
                            <ManagementItem
                                key={item.id}
                                icon={item.icon}
                                title={item.title}
                                description={item.description}
                                onClick={item.onClick}
                            />
                        ))}
                    </div>
                </CardContent>
                 {totalPages > 1 && (
                    <CardFooter className="flex justify-start">
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage <= 1 || isPending}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage >= totalPages || isPending}
                            >
                                Next
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardFooter>
                )}
            </Card>

            {/* Dialog for running a saved command with parameters */}
            <Dialog open={!!commandToRun} onOpenChange={(open) => !open && setCommandToRun(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Run: {commandToRun?.name}</DialogTitle>
                        <DialogDescription>{commandToRun?.description}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {(commandToRun?.parameters || []).map(param => (
                            <div key={param.key} className="space-y-2">
                                <Label htmlFor={param.key}>{param.label}</Label>
                                <Input
                                    id={param.key}
                                    value={commandParams[param.key] || ''}
                                    onChange={e => setCommandParams(prev => ({ ...prev, [param.key]: e.target.value }))}
                                    placeholder={param.defaultValue}
                                    type={param.type === 'number' ? 'number' : 'text'}
                                />
                            </div>
                        ))}
                        {(!commandToRun?.parameters || commandToRun.parameters.length === 0) && (
                            <p className="text-sm text-muted-foreground">This command has no parameters.</p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setCommandToRun(null)}>Cancel</Button>
                        <Button onClick={handleRunSavedCommand} disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Run Command
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
            {/* Dialog for Nginx */}
            <Dialog open={isNginxDialogOpen} onOpenChange={setIsNginxDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Configure Nginx Reverse Proxy</DialogTitle>
                        <DialogDescription>Point domains/paths to a running application.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="nginx-domains">Domains / Paths</Label>
                            <Textarea id="nginx-domains" value={nginxDomains} onChange={e => setNginxDomains(e.target.value)} placeholder={"example.com\nwww.example.com/subpath"} rows={3} />
                            <p className="text-xs text-muted-foreground">Enter one URL per line.</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="proxy-url">Proxy Pass URL</Label>
                            <Input id="proxy-url" value={proxyUrl} onChange={e => setProxyUrl(e.target.value)} />
                            <p className="text-xs text-muted-foreground">The internal URL of your application (e.g., http://localhost:3000).</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsNginxDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleNginxConfig} disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Generate & Run
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
             {/* Dialog for Certbot */}
             <Dialog open={isCertbotDialogOpen} onOpenChange={setIsCertbotDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Setup SSL with Certbot</DialogTitle>
                        <DialogDescription>Install a free SSL certificate from Let's Encrypt.</DialogDescription>
                    </DialogHeader>
                        <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="certbot-domain">Domain</Label>
                            <Input id="certbot-domain" value={certbotDomain} onChange={e => setCertbotDomain(e.target.value)} placeholder="e.g., yourdomain.com" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="certbot-email">Email</Label>
                            <Input id="certbot-email" type="email" value={certbotEmail} onChange={e => setCertbotEmail(e.target.value)} placeholder="e.g., admin@yourdomain.com" />
                        </div>
                    </div>
                    <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsCertbotDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleInstallCertbot} disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Setup SSL
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
            {/* Dialog for Custom Command */}
            <Dialog open={isCustomCommandDialogOpen} onOpenChange={setIsCustomCommandDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Run Custom Command</DialogTitle>
                        <DialogDescription>Execute any shell command on the server.</DialogDescription>
                    </DialogHeader>
                    <div className="grid w-full gap-2 py-4">
                        <Textarea value={customCommand} onChange={(e) => setCustomCommand(e.target.value)} placeholder="e.g., ls -la" rows={4} className="font-mono" />
                    </div>
                    <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsCustomCommandDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleRunCustomCommand} disabled={isPending || !customCommand}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Run Command
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
