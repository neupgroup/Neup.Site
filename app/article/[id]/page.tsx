
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card';
import { Button } from '#/components/ui/button';
import { LinkButton } from "#/components/ui/link-button";
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

export default function ViewArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <div className="w-full">
        <div className="mb-4">
            <LinkButton variant="outlined" href="/article">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Articles
                </LinkButton>
        </div>
      <header className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-2xl font-semibold tracking-tight">View Article</h1>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Article: {id}</CardTitle>
          <CardDescription>
            Viewing details for a single article.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
            <p>Article content will be displayed here.</p>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
