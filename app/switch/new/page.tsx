'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Plus } from 'lucide-react';
import { createAssetForAccount } from '@/services/assets';
import { appendProject } from '@/inapp/helpers/application-mode';
import { useToast } from '@neup/core/hooks/useToast';
import { usePageTitle } from '@neup/core/hooks/use-page-title';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@neup/components/ui/card';
import { Button } from '@neup/components/ui/button';
import { Input } from '@neup/components/ui/input';

export default function NewProjectPage() {
    usePageTitle('New Project');
    const router = useRouter();
    const { toast } = useToast();
    const [name, setName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const handleCreate = async () => {
        if (!name.trim()) {
            toast({ variant: 'destructive', title: 'Missing name', description: 'Project name is required.' });
            return;
        }

        setIsCreating(true);
        const result = await createAssetForAccount({ name });
        if (result.success && result.asset) {
            router.replace(appendProject('/switch', result.asset.id));
            return;
        }

        toast({ variant: 'destructive', title: 'Error', description: result.error });
        setIsCreating(false);
    };

    return (
        <div className="w-full space-y-6">
            <Button variant="plain" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Switch Project
            </Button>
            <Card>
                <CardHeader>
                    <CardTitle>New Project</CardTitle>
                    <CardDescription>Start a new project for your account.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="project-name">Name</label>
                        <Input id="project-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Project name" />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button variant="solid" onClick={handleCreate} disabled={isCreating}>
                        {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                        Create Project
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
