
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ViewCollectionPage({ params }: { params: { id: string } }) {
  return (
    <div className="w-full">
        <div className="mb-4">
            <Button variant="ghost" asChild>
                <Link href="/estate/collection">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Collections
                </Link>
            </Button>
        </div>
      <header className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-2xl font-semibold tracking-tight">View Collection</h1>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Collection: {params.id}</CardTitle>
          <CardDescription>
            Viewing details for a single collection.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
            <p>Collection content will be displayed here.</p>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
