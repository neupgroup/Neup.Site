
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getPages, type Page, deletePage } from '@/actions/editor/pages';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Plus, Globe, Trash2, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function PagesPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageToDelete, setPageToDelete] = useState<string | null>(null);

  const { toast } = useToast();

  const fetchPages = async () => {
    setLoading(true);
    const pagesResult = await getPages();
    if (pagesResult.success && pagesResult.pages) {
      const sortedPages = pagesResult.pages.sort((a, b) => {
          const dateA = a.updatedAt ? new Date(a.updatedAt) : new Date(0);
          const dateB = b.updatedAt ? new Date(b.updatedAt) : new Date(0);
          return dateB.getTime() - dateA.getTime();
      });
      setPages(sortedPages);
    } else {
      setError(pagesResult.error || 'Failed to fetch pages');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const handleDeletePage = async () => {
    if (!pageToDelete) return;
    const result = await deletePage(pageToDelete);
    if (result.success) {
      toast({ title: "Page Deleted", description: "The page and its associated paths have been deleted."});
      fetchPages();
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error });
    }
    setPageToDelete(null);
  }


  if (loading) {
    return (
      <div className="w-full space-y-4">
        <div className="flex justify-between items-center mb-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-36" />
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}><CardHeader><Skeleton className="h-20 w-full" /></CardHeader></Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="w-full max-w-2xl">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full">
      <header className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-2xl font-semibold tracking-tight">Pages</h1>
        <Button asChild>
          <Link href="/site/pages/create">
            <Plus className="mr-2 h-4 w-4" /> Create New Page
          </Link>
        </Button>
      </header>
      {pages.length === 0 ? (
        <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
            <Globe className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No Pages Yet</h3>
            <p>Click "Create New Page" to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pages.map((page) => (
            <Card key={page.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="truncate">{page.name || page.id}</CardTitle>
                        <CardDescription>Last updated: {page.updatedAt ? new Date(page.updatedAt).toLocaleString() : 'N/A'}</CardDescription>
                    </div>
                     <div className="flex items-center gap-2 flex-shrink-0">
                        <Button asChild variant="outline" size="sm">
                            <Link href={`/site/pages/${page.id}`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Manage
                            </Link>
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => setPageToDelete(page.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
       <AlertDialog open={!!pageToDelete} onOpenChange={(open) => !open && setPageToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this page and all its associated URL paths.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPageToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeletePage}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
