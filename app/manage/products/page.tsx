'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card';
import { Package } from 'lucide-react';

export default function ProductsPage() {
    
  return (
    <div className="w-full">
      <header className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-2xl font-semibold tracking-tight">Manage Products</h1>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Manage Products</CardTitle>
          <CardDescription>
            Create and manage your products here.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p>Product management functionality coming soon.</p>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
