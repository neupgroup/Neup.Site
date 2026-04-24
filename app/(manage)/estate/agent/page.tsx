
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Plus } from 'lucide-react';
import Link from 'next/link';

export default function AgentListPage() {
  return (
    <div className="w-full">
      <header className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-2xl font-semibold tracking-tight">Agents</h1>
        <Button asChild>
            <Link href="/estate/agent/create">
                <Plus className="mr-2 h-4 w-4" /> Add Agent
            </Link>
        </Button>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>All Agents</CardTitle>
          <CardDescription>
            Browse and manage your real estate agents.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
            <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p>Agent listing will be displayed here.</p>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
