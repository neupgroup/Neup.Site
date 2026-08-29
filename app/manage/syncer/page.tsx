'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card';
import { RefreshCw } from 'lucide-react';
import { usePageTitle } from '#/core/hooks/use-page-title';

export default function ManageSyncerPage() {
  usePageTitle('Syncer');

  return (
    <div className="w-full">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="font-headline text-2xl font-semibold tracking-tight">Manage Syncer</h1>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Manage Syncer</CardTitle>
          <CardDescription>
            Configure and run synchronization workflows for the current site.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border-2 border-dashed p-12 text-center text-muted-foreground">
            <RefreshCw className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p>Syncer management functionality coming soon.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
