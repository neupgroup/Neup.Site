
'use client';

import { useEffect, use } from 'react';
import { redirect } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

export default function PrebuiltRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  useEffect(() => {
    if (id) {
      redirect(`/site/editor/prebuilt?type=page&id=${id}`);
    }
  }, [id]);

  return (
    <div className="p-8 space-y-4">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-8 w-1/2" />
        <p>Redirecting to the section assembly editor...</p>
    </div>
  );
}
