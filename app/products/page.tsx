'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@neup/components/ui/card';
import { Package } from 'lucide-react';
import Link from 'next/link';
import { LinkButton } from '@neup/components/ui/link-button';
import { appendProject } from '@/inapp/helpers/application-mode';

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const project = (await searchParams).project?.trim() || null;
    
  return (
    <div className="w-full">
      <header className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-2xl font-semibold tracking-tight">Products</h1>
        <LinkButton href={appendProject('/products/new', project)}>New Product</LinkButton>
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
            <p>No products have been created yet.</p>
            <Link href={appendProject('/products/new', project)} className="mt-4 inline-block text-sm text-primary hover:underline">Create your first product</Link>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
