
'use client';

import { useParams } from 'next/navigation';
import FileManager from '@/components/dashboard/server/FileManager';

export default function ServerFilesPage() {
  const params = useParams<{ id: string }>();

  return (
    <div className="w-full">
      <header className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-2xl font-semibold tracking-tight">File Manager</h1>
        <p className="text-muted-foreground">Browse and manage files on this server.</p>
      </header>
      <FileManager serverId={params.id} />
    </div>
  );
}
