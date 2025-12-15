
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Redo } from 'lucide-react';

export default function RedirectsPage() {
    
  return (
    <div className="w-full">
      <header className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-2xl font-semibold tracking-tight">Redirects</h1>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Manage Redirects</CardTitle>
          <CardDescription>
            Create and manage URL redirects for your site.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
            <Redo className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p>Redirect management functionality coming soon.</p>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
