
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Puzzle } from 'lucide-react';

export default function ModulesPage() {
  return (
    <div className="w-full">
      <header className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-2xl font-semibold tracking-tight">Modules</h1>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Manage Modules</CardTitle>
          <CardDescription>
            This is where you will manage your site's modules.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
                <Puzzle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">Module Management</h3>
                <p>This section is under construction.</p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
