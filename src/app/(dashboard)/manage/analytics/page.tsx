'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart } from 'lucide-react';

export default function AnalyticsPage() {
    
  return (
    <div className="w-full">
      <header className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-2xl font-semibold tracking-tight">Manage Analytics</h1>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Manage Analytics</CardTitle>
          <CardDescription>
            View and analyze your site's performance and traffic.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
            <BarChart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p>Analytics functionality coming soon.</p>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
