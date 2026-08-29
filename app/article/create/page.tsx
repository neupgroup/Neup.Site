
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card';
import { Button } from '#/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateArticlePage() {
  return (
    <div className="w-full">
        <div className="mb-4">
            <Button type="outlined" asChild>
                <Link href="/article">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Articles
                </Link>
            </Button>
        </div>
      <header className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-2xl font-semibold tracking-tight">Create Article</h1>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>New Article</CardTitle>
          <CardDescription>
            Fill in the details to create a new article.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
            <p>Article creation form will be here.</p>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
