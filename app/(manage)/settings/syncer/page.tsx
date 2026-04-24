'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';
import { usePageTitle } from '@/hooks/use-page-title';

export default function SyncerSettingsPage() {
  usePageTitle('Syncer');

  return (
    <div className="w-full max-w-4xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold font-headline tracking-tight">Syncer</h1>
        <p className="text-muted-foreground">Manage sync workflows and keep your environment in sync.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Syncer Settings
          </CardTitle>
          <CardDescription>
            Configure and run synchronization tasks for your workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Syncer is ready. More controls can be added here as needed.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
