
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

export default function ViewAgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <div className="w-full">
        <div className="mb-4">
            <Button variant="tertiary" asChild>
                <Link href="/estate/agent">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Agents
                </Link>
            </Button>
        </div>
      <header className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-2xl font-semibold tracking-tight">View Agent</h1>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Agent: {id}</CardTitle>
          <CardDescription>
            Viewing details for a single agent.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
            <p>Agent content will be displayed here.</p>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
