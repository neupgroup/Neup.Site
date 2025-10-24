
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

import { Search, Loader2, Globe, Lock, Terminal, Code, ChevronLeft, ChevronRight } from 'lucide-react';

const FormContainer = ({ children }: { children: React.ReactNode }) => (
    <div className="p-4 bg-muted/50 border-t">
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
    const [commandParams, setCommandParams] = useState<Record<string, string>>({});
    
    return (
        <div className="space-y-4">
            {(command.parameters || []).map(param => (
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
            {(!command.parameters || command.parameters.length === 0) && (
                <p className="text-sm text-muted-foreground">This command has no parameters.</p>
            )}
            <Button onClick={() => onRun(command.id, commandParams)} disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Run Command
            </Button>
        </div>
    );
};


export default function ServerManagement({ serverId }: { serverId: string }) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [allCommands, setAllCommands] = useState<ServerCommand[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;

    useEffect(() => {
        const fetchCommands = async () => {
            const result = await getServerCommands({ pageSize: 1000 });
            if (result.success && result.commands) {
                setAllCommands(result.commands);
            }
        };
        fetchCommands();
    }, []);
    
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

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
    }

    const staticManagementItems = [
        {
            id: 'nginx-config',
            title: 'Configure Nginx Reverse Proxy',
            description: 'Point domains/paths to a running application.',
            icon: Globe,
            form: <NginxForm onRun={handleRunCommand} isPending={isPending} />
        },
        {
            id: 'certbot-setup',
            title: 'Setup SSL with Certbot',
            description: 'Install a free SSL certificate from Let\'s Encrypt.',
            icon: Lock,
            form: <CertbotForm onRun={handleRunCommand} isPending={isPending} />
        },
        {
            id: 'custom-command',
            title: 'Run Custom Command',
            description: 'Execute any shell command on the server.',
            icon: Terminal,
            form: <CustomCommandForm onRun={handleRunCommand} isPending={isPending} />
        },
    ];

    const allManagementItems = [
        ...allCommands.map(cmd => ({
            id: cmd.id,
            title: cmd.name,
            description: cmd.description || 'No description',
            icon: Code,
            form: <SavedCommandForm command={cmd} onRun={handleRunSavedCommand} isPending={isPending} />
        })),
        ...staticManagementItems,
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
                <Accordion type="single" collapsible className="w-full space-y-2">
                    {paginatedItems.map(({id, icon: Icon, title, description, form}) => (
                        <AccordionItem value={id!} key={id} className="border rounded-md px-2 hover:bg-muted/50 transition-colors">
                            <AccordionTrigger className="p-2 hover:no-underline text-left">
                                <div className="flex items-start gap-4">
                                    <Icon className="h-6 w-6 text-muted-foreground mt-1" />
                                    <div className="flex-1">
                                        <h4 className="font-medium text-left">{title}</h4>
                                        <p className="text-sm text-muted-foreground text-left">{description}</p>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <FormContainer>{form}</FormContainer>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
             {totalPages > 1 && (
                <CardFooter className="justify-start">
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
    );
}
