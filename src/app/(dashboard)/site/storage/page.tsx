
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { HardDrive } from 'lucide-react';

export default function SiteStoragePage() {
    
  return (
    <div className="w-full">
      <header className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-2xl font-semibold tracking-tight">Site Storage</h1>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Manage Site Storage</CardTitle>
          <CardDescription>
            View and manage storage for the current site.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
            <HardDrive className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p>Site storage management functionality coming soon.</p>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
