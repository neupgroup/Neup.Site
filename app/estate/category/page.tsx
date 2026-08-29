
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card';
import { Button } from '#/components/ui/buttons';
import { Tag, Plus } from 'lucide-react';
import Link from 'next/link';

export default function CategoryListPage() {
  return (
    <div className="w-full">
      <header className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-2xl font-semibold tracking-tight">Categories</h1>
        <Button variant="primary" asChild>
            <Link href="/estate/category/create">
                <Plus className="mr-2 h-4 w-4" /> Create Category
            </Link>
        </Button>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>All Categories</CardTitle>
          <CardDescription>
            Browse and manage your property categories.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
            <Tag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p>Category listing will be displayed here.</p>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
