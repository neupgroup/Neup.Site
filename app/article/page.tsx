
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card';
import { Button } from '#/components/ui/button';
import { Newspaper, Plus } from 'lucide-react';
import Link from 'next/link';

export default function ArticleListPage() {
  return (
    <div className="w-full">
      <header className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-2xl font-semibold tracking-tight">Articles</h1>
        <Button variant="primary" asChild>
            <Link href="/article/create">
                <Plus className="mr-2 h-4 w-4" /> Create Article
            </Link>
        </Button>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>All Articles</CardTitle>
          <CardDescription>
            Browse and manage your articles.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
            <Newspaper className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p>Article listing will be displayed here.</p>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
