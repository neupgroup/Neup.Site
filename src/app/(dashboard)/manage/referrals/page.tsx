'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Share2 } from 'lucide-react';

export default function ReferralsPage() {
    
  return (
    <div className="w-full">
      <header className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-2xl font-semibold tracking-tight">Referrals</h1>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Manage Referrals</CardTitle>
          <CardDescription>
            Track and manage your referrals here.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
            <Share2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p>Referral management functionality coming soon.</p>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
