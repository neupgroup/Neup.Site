
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { ServerCommand } from '@/schemas/command';
import { getServerCommands } from '@/actions/commands';
import { runCommand } from '@/actions/runner';

import { getConfigureNginxCommand } from '@/actions/server/management/configure-nginx';
import { getInstallCertbotNginxCommand } from '@/actions/server/management/install-certbot-nginx';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

import { Search, Loader2, ChevronLeft, ChevronRight, Globe } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

const FormContainer = ({ children }: { children: React.ReactNode }) => (
    <div className="p-4 border-t transition-colors group-hover:bg-muted/50 data-[state=open]:border-primary">
        {children}
    </div>
);

const NginxForm = ({ onRun, isPending }: { onRun: (cmd: string, desc: string) => void; isPending: boolean }) => {
    const [nginxDomains, setNginxDomains] = useState('');
    const [proxyUrl, setProxyUrl] = useState('http://localhost:3000');
    const { toast } = useToast();

    const handleNginxConfig = async () => {
        const urls = nginxDomains.split('\n').map(u => u.trim()).filter(Boolean);
        if (urls.length === 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'At least one domain is required.' });
            return;
        }
        try {
            const command = await getConfigureNginxCommand({ urls, proxyUrl, listenPort: 80 });
            onRun(command, `Configure Nginx for ${urls[0]}`);
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Configuration Error', description: e.message });
        }
    };

    return (
        <div className="space-y-4">
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
            <Button onClick={handleNginxConfig} disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate & Run
            </Button>
        </div>
    );
};

const CertbotForm = ({ onRun, isPending }: { onRun: (cmd: string, desc: string) => void; isPending: boolean }) => {
    const [certbotDomain, setCertbotDomain] = useState('');
    const [certbotEmail, setCertbotEmail] = useState('');
    const { toast } = useToast();

    const handleInstallCertbot = async () => {
        try {
            const command = await getInstallCertbotNginxCommand({ domain: certbotDomain, email: certbotEmail });
            onRun(command, `Install SSL for ${certbotDomain}`);
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'SSL Setup Error', description: e.message });
        }
    };
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="certbot-domain">Domain</Label>
                <Input id="certbot-domain" value={certbotDomain} onChange={e => setCertbotDomain(e.target.value)} placeholder="e.g., yourdomain.com" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="certbot-email">Email</Label>
                <Input id="certbot-email" type="email" value={certbotEmail} onChange={e => setCertbotEmail(e.target.value)} placeholder="e.g., admin@yourdomain.com" />
            </div>
            <Button onClick={handleInstallCertbot} disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Setup SSL
            </Button>
        </div>
    );
};

const CustomCommandForm = ({ onRun, isPending }: { onRun: (cmd: string, desc: string) => void; isPending: boolean }) => {
    const [customCommand, setCustomCommand] = useState('');
    return (
        <div className="space-y-2">
            <Textarea value={customCommand} onChange={(e) => setCustomCommand(e.target.value)} placeholder="e.g., ls -la" rows={4} className="font-mono" />
            <Button onClick={() => onRun(customCommand, 'Run custom command')} disabled={isPending || !customCommand}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Run Command
            </Button>
        </div>
    );
};

const SavedCommandForm = ({ command, onRun, isPending }: { command: ServerCommand, onRun: (cmdId: string, params: Record<string, any>) => void; isPending: boolean }) => {
    const [commandParams, setCommandParams] = useState<Record<string, string>>(() => {
        const initialParams: Record<string, string> = {};
        command.parameters?.forEach(p => {
            if (p.defaultValue) {
                initialParams[p.key] = p.defaultValue;
            }
        });
        return initialParams;
    });
    
    if (!command.parameters || command.parameters.length === 0) {
        return (
            <Button onClick={() => onRun(command.id!, {})} disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Run Command
            </Button>
        )
    }

    return (
        <div className="space-y-4">
            {(command.parameters || []).map(param => (
                <div key={param.key} className="space-y-2">
                    <Label htmlFor={param.key}>{param.label}</Label>
                    {param.type === 'textarea' ? (
                        <Textarea
                            id={param.key}
                            value={commandParams[param.key] || ''}
                            onChange={e => setCommandParams(prev => ({ ...prev, [param.key]: e.target.value }))}
                            placeholder={param.defaultValue}
                            rows={4}
                            className="font-mono"
                        />
                    ) : (
                        <Input
                            id={param.key}
                            value={commandParams[param.key] || ''}
                            onChange={e => setCommandParams(prev => ({ ...prev, [param.key]: e.target.value }))}
                            placeholder={param.defaultValue}
                            type={param.type === 'number' ? 'number' : 'text'}
                        />
                    )}
                </div>
            ))}
            <Button onClick={() => onRun(command.id!, commandParams)} disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Run Command
            </Button>
        </div>
    );
};


export default function ServerManagement({ serverId }: { serverId: string }) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [commands, setCommands] = useState<ServerCommand[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const pageSize = 5;

    const handleRunCommand = (command: string, description: string) => {
        startTransition(async () => {
            await runCommand(serverId, command);
            toast({ title: "Command Sent", description: `Running command: ${description}`});
        });
    };
    
    const handleRunSavedCommand = (commandId: string, params: Record<string, any>) => {
        startTransition(async () => {
            await runCommand(serverId, commandId, params);
            toast({ title: "Command Sent" });
        });
    };

    const staticManagementItems = [
        {
            id: 'nginx-config',
            name: 'Configure Nginx Reverse Proxy',
            description: 'Point domains/paths to a running application.',
            form: <NginxForm onRun={handleRunCommand} isPending={isPending} />
        },
        {
            id: 'certbot-setup',
            name: 'Setup SSL with Certbot',
            description: 'Install a free SSL certificate from Let\'s Encrypt.',
            form: <CertbotForm onRun={handleRunCommand} isPending={isPending} />
        },
        {
            id: 'custom-command',
            name: 'Run Custom Command',
            description: 'Execute any shell command on the server.',
            form: <CustomCommandForm onRun={handleRunCommand} isPending={isPending} />
        },
    ];
    
    const fetchCommands = async (page: number, search: string) => {
        setLoading(true);
        const savedCommandsResult = await getServerCommands({ page, pageSize, searchQuery: search });
        
        setTotalCount(savedCommandsResult.totalCount || 0);
        setCommands(savedCommandsResult.commands || []);
        setLoading(false);
    };

    useEffect(() => {
        startTransition(() => {
            fetchCommands(currentPage, searchQuery);
        });
    }, [currentPage, searchQuery]);
    
    const totalPages = Math.ceil(totalCount / pageSize);

    return (
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
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1); // Reset to first page on search
                        }}
                    />
                </div>
                <Accordion type="single" collapsible className="w-full space-y-2">
                    {loading || isPending ? (
                        <div className="space-y-2">
                            {[...Array(3)].map((_, i) => (
                            <div key={i} className="p-4 border rounded-lg space-y-2">
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                            ))}
                        </div>
                    ) : (
                        <>
                            {commands.map((cmd) => (
                                <AccordionItem value={cmd.id!} key={cmd.id} className="border rounded-lg data-[state=open]:border-primary group">
                                    <AccordionTrigger className="p-4 hover:no-underline text-left">
                                        <div className="flex-1 pr-4">
                                            <h4 className="font-medium text-left">{cmd.name}</h4>
                                            <p className="text-sm text-muted-foreground text-left">{cmd.description || 'No description'}</p>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <FormContainer>
                                            <SavedCommandForm command={cmd} onRun={handleRunSavedCommand} isPending={isPending} />
                                        </FormContainer>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                            {/* Static items can be added here if needed, or integrated into the fetched list */}
                        </>
                    )}
                </Accordion>
            </CardContent>
             {totalPages > 1 && (
                <CardFooter className="justify-start">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage <= 1 || isPending || loading}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage >= totalPages || isPending || loading}
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </CardFooter>
            )}
             <Alert>
                <Globe className="h-4 w-4" />
                <AlertTitle>Universal Variables</AlertTitle>
                <AlertDescription>
                    These variables are available in both the pre-processor and the Bash script.
                    <ul className="list-disc pl-5 mt-2 text-xs space-y-1">
                        <li><code className="font-mono bg-muted px-1 py-0.5 rounded">{`{{server_name}}`}</code></li>
                        <li><code className="font-mono bg-muted px-1 py-0.5 rounded">{`{{server_publicIp}}`}</code></li>
                        <li><code className="font-mono bg-muted px-1 py-0.5 rounded">{`{{server_basePath}}`}</code></li>
                        <li><code className="font-mono bg-muted px-1 py-0.5 rounded">{`{{server_appPath}}`}</code></li>
                        <li><code className="font-mono bg-muted px-1 py-0.5 rounded">{`{{server_availablePort}}`}</code></li>
                        <li><code className="font-mono bg-muted px-1 py-0.5 rounded">{`{{server_availablePorts}}`}</code></li>
                        <li><code className="font-mono bg-muted px-1 py-0.5 rounded">{`{{server_usedPorts}}`}</code></li>
                        <li><code className="font-mono bg-muted px-1 py-0.5 rounded text-blue-500">{`{{server_reservedPort}}`}</code></li>
                        <li><code className="font-mono bg-muted px-1 py-0.5 rounded">{`{{site_id}}`}</code></li>
                        <li><code className="font-mono bg-muted px-1 py-0.5 rounded">{`{{site_name}}`}</code></li>
                        <li><code className="font-mono bg-muted px-1 py-0.5 rounded">{`{{site_domain}}`}</code></li>
                        <li><code className="font-mono bg-muted px-1 py-0.5 rounded">{`{{account_id}}`}</code></li>
                        <li><code className="font-mono bg-muted px-1 py-0.5 rounded text-red-500">{`{{account_githubToken}}`}</code></li>
                    </ul>
                </AlertDescription>
            </Alert>
        </Card>
    );
}
