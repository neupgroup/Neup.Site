
'use client';

import { useEffect, use } from 'react';
import { redirect } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

export default function DraggerRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  useEffect(() => {
    if (id) {
      redirect(`/site/editor/dragger?id=${id}`);
    }
  }, [id]);

  return (
    <div className="p-8 space-y-4">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-8 w-1/2" />
        <div className="p-4 border rounded-lg space-y-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
        </div>
         <p>Redirecting to the editor...</p>
    </div>
  );
}
