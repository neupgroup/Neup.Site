'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { detectAndAppPortFromPm2 } from '@/actions/server/management/port-detection';
import { useRouter } from 'next/navigation';

interface SyncPortButtonProps {
    artifactId: string;
    serverId: string;
}

export function SyncPortButton({ artifactId, serverId }: SyncPortButtonProps) {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const handleSync = async () => {
        setLoading(true);
        try {
            const result = await detectAndAppPortFromPm2(artifactId, serverId);
            if (result.success && result.port) {
                toast({
                    title: "Port Synced",
                    description: `Application detected running on port ${result.port}.`,
                });
                router.refresh();
            } else {
                toast({
                    title: "Sync Failed",
                    description: result.error || "Could not detect port.",
                    variant: "destructive"
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "An unexpected error occurred.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={loading}
        >
            <RefreshCw className={`h-3 w-3 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Syncing...' : 'Sync Port'}
        </Button>
    );
}
