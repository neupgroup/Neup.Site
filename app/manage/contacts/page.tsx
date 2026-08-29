'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card';
import { Users } from 'lucide-react';
import { usePageTitle } from '#/core/hooks/use-page-title';

export default function ContactsPage() {
  usePageTitle('Contacts');
    
  return
 (
    <div className="w-full">
      <header className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-2xl font-semibold tracking-tight">Manage Contacts</h1>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Manage Contacts</CardTitle>
          <CardDescription>
            View and manage your contacts here.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p>Contact management functionality coming soon.</p>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
