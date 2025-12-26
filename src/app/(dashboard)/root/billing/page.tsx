
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';
import { usePageTitle } from '@/hooks/use-page-title';

export default function RootBillingPage() {
    usePageTitle('Root Billing', 'NeupSites');
    
  return (
    <div className="w-full">
      <header className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-2xl font-semibold tracking-tight">Root Billing</h1>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Manage Root Billing</CardTitle>
          <CardDescription>
            View and manage global billing settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
            <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p>Root billing management functionality coming soon.</p>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
