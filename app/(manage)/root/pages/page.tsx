
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { usePageTitle } from '@/core/hooks/use-page-title';

export default function RootPagesPage() {
    usePageTitle('Root Pages', 'NeupSites');
    
  return (
    <div className="w-full">
      <header className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-2xl font-semibold tracking-tight">Root Pages</h1>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Manage Root Pages</CardTitle>
          <CardDescription>
            This is a placeholder for managing global or root-level pages.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
            <p>Root pages functionality coming soon.</p>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
