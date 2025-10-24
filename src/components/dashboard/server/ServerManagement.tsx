'use client';

import { useState, useEffect, useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { ServerCommand } from '@/actions/commands';
import { getServerCommands } from '@/actions/commands';
import { runCommand } from '@/actions/runner';

// ASSUMPTION: The following actions from your previous version exist.
// Please ensure these files are in your project and the paths are correct.
import { getConfigureNginxCommand } from '@/actions/server/management/configure-nginx';
import { getInstallCertbotNginxCommand } from '@/actions/server/management/install-certbot-nginx';

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

// Icons
import { Search, Loader2, Globe, Lock, Send } from 'lucide-react';

export default function ServerManagement({ serverId }: { serverId: string }) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    // State for different management tasks
    const [customCommand, setCustomCommand] = useState('');
    const [nginxDomains, setNginxDomains] = useState('');
    const [proxyUrl, setProxyUrl] = useState('http://localhost:3000');
    const [certbotDomain, setCertbotDomain] = useState('');
    const [certbotEmail, setCertbotEmail] = useState('');
    
    // State for the "Run Saved Command" feature
    const [commandSearchQuery, setCommandSearchQuery] = useState('');
    const [searchedCommands, setSearchedCommands] = useState<ServerCommand[]>([]);
    const [loadingCommands, setLoadingCommands] = useState(false);
    const [commandToRun, setCommandToRun] = useState<ServerCommand | null>(null);
    const [commandParams, setCommandParams] = useState<Record<string, string>>({});
    
    // State for the command parameter dialog
    const [allocatePort, setAllocatePort] = useState(false);
    const [portToAllocate, setPortToAllocate] = useState<number | ''>('');
    const [portDescription, setPortDescription] = useState('');

    // Debounced search effect for saved commands
    useEffect(() => {
        if (commandSearchQuery.trim().length > 2) {
            const delayDebounceFn = setTimeout(async () => {
                setLoadingCommands(true);
                const result = await getServerCommands({ searchQuery: commandSearchQuery, pageSize: 5 });
                if (result.success && result.commands) {
                    setSearchedCommands(result.commands);
                }
                setLoadingCommands(false);
            }, 300);
            return () => clearTimeout(delayDebounceFn);
        } else {
            setSearchedCommands([]);
        }
    }, [commandSearchQuery]);

    const handleRunCommand = (command: string, commandName?: string, portAllocation?: { port: number; description: string; }) => {
        if (!command) return;
        startTransition(async () => {
            // NOTE: Ensure your `runCommand` action supports this signature from the previous version.
            await runCommand(serverId, command, {}, '', portAllocation);
            toast({ title: "Command Sent", description: `The command "${commandName || 'custom command'}" has been sent.` });
        });
    };

    const handleRunSavedCommand = () => {
        if (!commandToRun) return;

        let portAllocation;
        if (allocatePort) {
            if (!portToAllocate || !portDescription) {
                toast({ variant: 'destructive', title: 'Missing Port Info', description: 'Port and description are required for allocation.' });
                return;
            }
            portAllocation = { port: portToAllocate, description: portDescription };
        }

        startTransition(async () => {
            await runCommand(
                serverId,
                commandToRun.commandTemplate,
                commandParams,
                // This logic assumes a 'preprocess' flag determines if a pre-execution script is needed.
                // Adjust if your ServerCommand schema is different.
                commandToRun.preprocess ? commandToRun.commandTemplate : undefined,
                portAllocation,
                commandToRun.id
            );
            toast({ title: "Command Sent", description: `The command "${commandToRun.name}" has been sent.` });
            
            // Reset dialog state
            setCommandToRun(null);
            setCommandParams({});
            setAllocatePort(false);
            setPortToAllocate('');
            setPortDescription('');
        });
    };

    const handleNginxConfig = async () => {
        const urls = nginxDomains.split('\n').map(u => u.trim()).filter(Boolean);
        if (urls.length === 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'At least one domain is required.' });
            return;
        }

        try {
            const command = await getConfigureNginxCommand({ urls, proxyUrl, listenPort: 80 });
            handleRunCommand(command, `Configure Nginx for ${urls[0]}`);
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Configuration Error', description: e.message });
        }
    };

    const handleInstallCertbot = async () => {
        try {
            const command = await getInstallCertbotNginxCommand({ domain: certbotDomain, email: certbotEmail });
            handleRunCommand(command, `Install SSL for ${certbotDomain}`);
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'SSL Setup Error', description: e.message });
        }
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Server Management</CardTitle>
                    <CardDescription>Perform common server maintenance and setup tasks.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full space-y-2">
                        <AccordionItem value="run-saved-command" className="border-0">
                            <AccordionTrigger className="flex w-full items-center justify-between rounded-lg border p-4 hover:bg-muted/50 data-[state=open]:rounded-b-none data-[state=open]:border-b-0 hover:no-underline cursor-pointer">
                                <div>
                                    <h4 className="font-medium text-left">Run Saved Command</h4>
                                    <p className="text-sm text-muted-foreground text-left">Execute a pre-defined command template on this server.</p>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="border rounded-b-lg p-4 space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search for a command..."
                                        className="pl-8"
                                        value={commandSearchQuery}
                                        onChange={(e) => setCommandSearchQuery(e.target.value)}
                                    />
                                </div>
                                {loadingCommands ? (
                                    <div className="text-center p-4"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
                                ) : searchedCommands.length > 0 ? (
                                    <div className="space-y-2">
                                        {searchedCommands.map(cmd => (
                                            <div key={cmd.id} className="flex items-center justify-between p-2 border rounded-md">
                                                <div className="flex-1">
                                                    <p className="font-medium">{cmd.name}</p>
                                                    <p className="text-xs text-muted-foreground">{cmd.description}</p>
                                                </div>
                                                <Button size="sm" onClick={() => setCommandToRun(cmd)}>Run</Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : commandSearchQuery.length > 2 ? (
                                    <p className="text-sm text-muted-foreground text-center p-4">No commands found.</p>
                                ) : null}
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="config-nginx" className="border-0">
                            <AccordionTrigger className="flex w-full items-center justify-between rounded-lg border p-4 hover:bg-muted/50 data-[state=open]:rounded-b-none data-[state=open]:border-b-0 hover:no-underline cursor-pointer">
                                <div>
                                    <h4 className="font-medium text-left">Configure Nginx Reverse Proxy</h4>
                                    <p className="text-sm text-muted-foreground text-left">Point domains/paths to a running application.</p>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="border rounded-b-lg p-4 space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="nginx-domains">Domains / Paths</Label>
                                    <Textarea
                                        id="nginx-domains"
                                        value={nginxDomains}
                                        onChange={e => setNginxDomains(e.target.value)}
                                        placeholder={"example.com\nwww.example.com/subpath"}
                                        rows={3}
                                    />
                                    <p className="text-xs text-muted-foreground">Enter one URL per line.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="proxy-url">Proxy Pass URL</Label>
                                    <Input id="proxy-url" value={proxyUrl} onChange={e => setProxyUrl(e.target.value)} />
                                    <p className="text-xs text-muted-foreground">The internal URL of your application (e.g., http://localhost:3000).</p>
                                </div>
                                <Button onClick={handleNginxConfig} disabled={isPending}>
                                    <Globe className="mr-2 h-4 w-4" /> Configure Nginx
                                </Button>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="install-certbot" className="border-0">
                            <AccordionTrigger className="flex w-full items-center justify-between rounded-lg border p-4 hover:bg-muted/50 data-[state=open]:rounded-b-none data-[state=open]:border-b-0 hover:no-underline cursor-pointer">
                                <div>
                                    <h4 className="font-medium text-left">Setup SSL with Certbot</h4>
                                    <p className="text-sm text-muted-foreground text-left">Install a free SSL certificate from Let&apos;s Encrypt.</p>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="border rounded-b-lg p-4 space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="certbot-domain">Domain</Label>
                                    <Input id="certbot-domain" value={certbotDomain} onChange={e => setCertbotDomain(e.target.value)} placeholder="e.g., yourdomain.com" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="certbot-email">Email</Label>
                                    <Input id="certbot-email" type="email" value={certbotEmail} onChange={e => setCertbotEmail(e.target.value)} placeholder="e.g., admin@yourdomain.com" />
                                </div>
                                <Button onClick={handleInstallCertbot} disabled={isPending}>
                                    <Lock className="mr-2 h-4 w-4" /> Setup SSL
                                </Button>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="custom-command" className="border-0">
                            <AccordionTrigger className="flex w-full items-center justify-between rounded-lg border p-4 hover:bg-muted/50 data-[state=open]:rounded-b-none data-[state=open]:border-b-0 hover:no-underline cursor-pointer">
                                <div>
                                    <h4 className="font-medium text-left">Run Custom Command</h4>
                                    <p className="text-sm text-muted-foreground text-left">Execute any shell command on the server.</p>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="border rounded-b-lg p-4">
                                <div className="grid w-full gap-2">
                                    <Textarea
                                        value={customCommand}
                                        onChange={(e) => setCustomCommand(e.target.value)}
                                        placeholder="e.g., ls -la"
                                        rows={4}
                                        className="font-mono"
                                    />
                                    <div className="flex justify-start">
                                        <Button size="sm" onClick={() => handleRunCommand(customCommand)} disabled={isPending || !customCommand}>
                                            <Send className="mr-2 h-4 w-4" /> Run Command
                                        </Button>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </CardContent>
            </Card>

            {commandToRun && (
                <Dialog open={!!commandToRun} onOpenChange={() => { setCommandToRun(null); setCommandParams({}); }}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Run: {commandToRun.name}</DialogTitle>
                            <DialogDescription>{commandToRun.description}</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            {(commandToRun.parameters || []).map(param => (
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
                            {(!commandToRun.parameters || commandToRun.parameters.length === 0) && (
                                <p className="text-sm text-muted-foreground">This command has no parameters.</p>
                            )}
                            <div className="space-y-3 pt-4 border-t">
                                <div className="flex items-center space-x-2">
                                    <Switch id="allocate-port" checked={allocatePort} onCheckedChange={setAllocatePort} />
                                    <Label htmlFor="allocate-port">Allocate a port for this command</Label>
                                </div>
                                {allocatePort && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="port-to-allocate">Port</Label>
                                            <Input
                                                id="port-to-allocate"
                                                type="number"
                                                value={portToAllocate}
                                                onChange={(e) => setPortToAllocate(e.target.value ? parseInt(e.target.value, 10) : '')}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="port-description">Description</Label>
                                            <Input
                                                id="port-description"
                                                value={portDescription}
                                                onChange={(e) => setPortDescription(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
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
            )}
        </>
    );
}