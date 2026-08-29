

'use client';

import { useState, useTransition } from 'react';
import { useToast } from '#/core/hooks/useToast';
import { runCommand } from '@/services/runner';
import { useRouter } from 'next/navigation';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '#/components/ui/card';
import { Button } from '#/components/ui/button';
import { Textarea } from '#/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '#/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '#/components/ui/alert';
import { Info } from 'lucide-react';

const ServerManagement = ({ serverId }: { serverId: string }) => {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [customCommand, setCustomCommand] = useState('');
    const router = useRouter();

    const handleRunCustomCommand = () => {
        if (!customCommand.trim()) {
            toast({
                variant: 'destructive',
                title: 'Command is empty',
                description: 'Please enter a command to run.'
            });
            return;
        }

        startTransition(async () => {
            const result = await runCommand(serverId, customCommand, {}, 'Custom Command');
            if(result.success) {
                toast({ title: "Custom Command Sent", description: "Check the server logs for output." });
            } else {
                toast({ variant: "destructive", title: "Command Failed", description: result.error || "An unknown error occurred."});
            }
            // We might want to clear the command on success or failure
            setCustomCommand('');
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Run Custom Command</CardTitle>
                <CardDescription>Enter a command or a full command template to execute on the server.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <Textarea
                        value={customCommand}
                        onChange={(e) => setCustomCommand(e.target.value)}
                        placeholder={'<server.ubuntuBashProcessor>\\n  echo "Hello, World!"\\n</server.ubuntuBashProcessor>'}
                        className="font-mono h-48"
                        disabled={isPending}
                    />
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Did you know?</AlertTitle>
                        <AlertDescription>
                            You can use the full template syntax here, including pre-processors and universal variables like <code className="font-mono bg-muted px-1 rounded">{`{{universal.server_name}}`}</code>.
                        </AlertDescription>
                    </Alert>
                </div>
            </CardContent>
            <CardFooter>
                 <Button variant="primary" onClick={handleRunCustomCommand} disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Execute Command
                </Button>
            </CardFooter>
        </Card>
    );
};

ServerManagement.Skeleton = function ServerManagementSkeleton() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Run Custom Command</CardTitle>
                <CardDescription>Enter a command or a full command template to execute on the server.</CardDescription>
            </CardHeader>
            <CardContent>
                <Skeleton className="h-48 w-full" />
            </CardContent>
             <CardFooter>
                <Skeleton className="h-10 w-36" />
            </CardFooter>
        </Card>
    )
}

export default ServerManagement;
