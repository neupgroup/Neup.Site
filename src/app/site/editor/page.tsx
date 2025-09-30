
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditorRedirectPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get('id');

    useEffect(() => {
        if (id) {
            router.replace(`/site/editor/dragger?id=${id}`);
        } else {
            router.replace('/site/editor/dragger');
        }
    }, [id, router]);

    return (
        <div className="flex h-full w-full flex-col bg-background text-foreground">
            <header className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-4 md:px-6">
                <Skeleton className="h-8 w-48" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-20" />
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-20" />
                </div>
            </header>
            <main className="flex-1 overflow-y-auto bg-background p-10">
                <div className="text-center">Redirecting to the editor...</div>
            </main>
        </div>
    );
}
