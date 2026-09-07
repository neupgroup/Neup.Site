
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card';
import { Button } from '#/components/ui/button';
import { LinkButton } from "#/components/ui/link-button";
import { Building, Plus } from 'lucide-react';
import Link from 'next/link';

export default function PropertyListPage() {
  return (
    <div className="w-full">
      <header className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-2xl font-semibold tracking-tight">Properties</h1>
        <LinkButton variant="solid" href="/estate/property/create">
                <Plus className="mr-2 h-4 w-4" /> Add Property
            </LinkButton>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>All Properties</CardTitle>
          <CardDescription>
            Browse and manage your real estate properties.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
            <Building className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p>Property listing will be displayed here.</p>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
