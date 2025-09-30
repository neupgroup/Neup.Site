
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSites, type Site, deleteSite } from '@/actions/editor/site';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Plus, Eye, Pencil, Globe, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSites = async () => {
    setLoading(true);
    const result = await getSites();
    if (result.success && result.sites) {
      setSites(result.sites.sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt) : new Date(0);
        const dateB = b.updatedAt ? new Date(b.updatedAt) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      }));
    } else {
      setError(result.error || 'Failed to fetch sites');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSites();
  }, []);

  const handleDelete = async (id: string) => {
    const result = await deleteSite(id);
    if (result.success) {
      toast({ title: "Page Deleted", description: "The page and its associated paths have been deleted."});
      fetchSites();
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error });
    }
  }

  if (loading) {
    return (
      <div className="w-full space-y-4">
        <div className="flex justify-end mb-4">
            <Skeleton className="h-10 w-36" />
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Skeleton className="h-9 w-9" />
                <Skeleton className="h-9 w-9" />
              </CardFooter>
            </Card>
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
      {sites.length === 0 ? (
        <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
            <Globe className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No Pages Yet</h3>
            <p>Click "Create New Page" to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sites.map((site) => (
            <Card key={site.id} className="flex flex-col sm:flex-row sm:items-center">
              <CardHeader className="flex-1">
                <CardTitle className="truncate">Page: {site.id.substring(0, 8)}...</CardTitle>
                <CardDescription>
                  Last updated: {site.updatedAt ? new Date(site.updatedAt).toLocaleString() : 'N/A'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 pt-6 sm:pt-0">
                 <p className="text-sm text-muted-foreground">
                  This page has {site.elements.length} root element(s).
                </p>
              </CardContent>
              <CardFooter className="pt-6 sm:pt-0 justify-start sm:justify-end flex-shrink-0">
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" asChild>
                      <Link href={`/site/pages/${site.id}`} title="View">
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="default" size="icon" asChild>
                      <Link href={`/site/editor?mode=edit&id=${site.id}`} title="Edit">
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the page and any URL paths associated with it.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(site.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
