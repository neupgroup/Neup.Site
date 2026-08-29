
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card';
import { Button } from '#/components/ui/button';
import { UtensilsCrossed, Plus } from 'lucide-react';
import Link from 'next/link';
import { usePageTitle } from '#/core/hooks/use-page-title';

export default function DishListPage() {
  usePageTitle('Dishes');
  return (
    <div className="w-full">
      <header className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-2xl font-semibold tracking-tight">Tourio Dishes</h1>
        <Button variant="primary" asChild>
            <Link href="/tourio/dish/create">
                <Plus className="mr-2 h-4 w-4" /> Create Dish
            </Link>
        </Button>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>All Dishes</CardTitle>
          <CardDescription>
            Browse and manage your Tourio dishes.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
            <UtensilsCrossed className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p>Dish listing will be displayed here.</p>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
