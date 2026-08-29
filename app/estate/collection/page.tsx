
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card';
import { Button } from '#/components/ui/buttons';
import { Layers, Plus } from 'lucide-react';
import Link from 'next/link';

export default function CollectionListPage() {
  return (
    <div className="w-full">
      <header className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-2xl font-semibold tracking-tight">Collections</h1>
        <Button variant="primary" asChild>
            <Link href="/estate/collection/create">
                <Plus className="mr-2 h-4 w-4" /> Create Collection
            </Link>
        </Button>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>All Collections</CardTitle>
          <CardDescription>
            Browse and manage your property collections.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
            <Layers className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p>Collection listing will be displayed here.</p>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
