
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card';
import { Button } from '#/components/ui/button';
import { LinkButton } from "#/components/ui/link-button";
import { Mountain, Plus } from 'lucide-react';
import Link from 'next/link';
import { usePageTitle } from '#/core/hooks/use-page-title';

export default function ExperienceListPage() {
  usePageTitle('Experiences');
  return (
    <div className="w-full">
      <header className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-2xl font-semibold tracking-tight">Tourio Experiences</h1>
        <LinkButton variant="solid" href="/tourio/experience/create">
                <Plus className="mr-2 h-4 w-4" /> Create Experience
            </LinkButton>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>All Experiences</CardTitle>
          <CardDescription>
            Browse and manage your Tourio experiences.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
            <Mountain className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p>Experience listing will be displayed here.</p>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
