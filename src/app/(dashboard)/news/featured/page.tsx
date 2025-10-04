
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Star } from 'lucide-react';

export default function NewsFeaturedPage() {
    
  return (
    <div className="w-full">
      <header className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-2xl font-semibold tracking-tight">Featured Articles</h1>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Manage Featured Articles</CardTitle>
          <CardDescription>
            Select which articles to feature on your site.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
            <Star className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p>Functionality to manage featured articles is coming soon.</p>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
