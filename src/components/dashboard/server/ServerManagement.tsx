
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { ServerCommand } from '@/schemas/command';
import { getServerCommands } from '@/actions/commands';
import { runCommand } from '@/actions/runner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

import { Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

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
    
    const handleRunSavedCommand = (commandId: string, params: Record<string, any>) => {
        startTransition(async () => {
            await runCommand(serverId, commandId, params);
            toast({ title: "Command Sent" });
        });
    };
    
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
        <div>
            <div className="mb-4">
                <h3 className="text-lg font-semibold">Server Management</h3>
                <p className="text-sm text-muted-foreground">Perform common server maintenance and setup tasks.</p>
            </div>
            <div className="space-y-4">
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
                                        <div className="p-4 border-t transition-colors group-hover:bg-muted/50 data-[state=open]:border-primary">
                                            <SavedCommandForm command={cmd} onRun={handleRunSavedCommand} isPending={isPending} />
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </>
                    )}
                </Accordion>
            </div>
             {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
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
                </div>
            )}
        </div>
    );
}
