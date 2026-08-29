
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card';
import { HardDrive } from 'lucide-react';
import { usePageTitle } from '#/core/hooks/use-page-title';

export default function SiteStorageHubPage() {
  usePageTitle('Storage');
    
  return (
    <div className="w-full">
      <header className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-2xl font-semibold tracking-tight">Asset Storage</h1>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Manage Storage</CardTitle>
          <CardDescription>
            View and manage storage for all your site's resources.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
            <HardDrive className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p>A summary of your site's storage will be displayed here soon.</p>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
