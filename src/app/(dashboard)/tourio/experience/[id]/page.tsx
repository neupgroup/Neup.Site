
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ViewExperiencePage({ params }: { params: { id: string } }) {
  return (
    <div className="w-full">
        <div className="mb-4">
            <Button variant="ghost" asChild>
                <Link href="/tourio/experience">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Experiences
                </Link>
            </Button>
        </div>
      <header className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-2xl font-semibold tracking-tight">View Experience</h1>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Experience: {params.id}</CardTitle>
          <CardDescription>
            Viewing details for a single experience.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
            <p>Experience content will be displayed here.</p>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
