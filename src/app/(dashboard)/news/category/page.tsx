
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tag } from 'lucide-react';

export default function NewsCategoryPage() {
    
  return (
    <div className="w-full">
      <header className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-2xl font-semibold tracking-tight">News Categories</h1>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Manage Categories</CardTitle>
          <CardDescription>
            Organize your news articles into categories.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
            <Tag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p>News category management is coming soon.</p>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
