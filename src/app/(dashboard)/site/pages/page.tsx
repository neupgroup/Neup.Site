
'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { getPages, type Page, deletePage } from '@/actions/editor/pages';
import { getPathsForPage, addPath, deletePath as deletePathAction, type Path } from '@/actions/paths';
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
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Plus, Eye, Pencil, Globe, Trash2, Link as LinkIcon, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

type PageWithPaths = Page & { paths: Path[] };

export default function PagesPage() {
  const [pages, setPages] = useState<PageWithPaths[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageToDelete, setPageToDelete] = useState<string | null>(null);
  const [newPathValues, setNewPathValues] = useState<Record<string, string>>({});

  const { toast } = useToast();

  const fetchPagesAndPaths = async () => {
    setLoading(true);
    const pagesResult = await getPages();
    if (pagesResult.success && pagesResult.pages) {
        const pagesWithPaths = await Promise.all(pagesResult.pages.map(async (page) => {
            const pathsResult = await getPathsForPage(page.id);
            return {
                ...page,
                paths: pathsResult.paths || [],
            };
        }));
        
        setPages(pagesWithPaths.sort((a, b) => {
            const dateA = a.updatedAt ? new Date(a.updatedAt) : new Date(0);
            const dateB = b.updatedAt ? new Date(b.updatedAt) : new Date(0);
            return dateB.getTime() - dateA.getTime();
        }));

    } else {
      setError(pagesResult.error || 'Failed to fetch pages');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPagesAndPaths();
  }, []);

  const handleDeletePage = async () => {
    if (!pageToDelete) return;
    const result = await deletePage(pageToDelete);
    if (result.success) {
      toast({ title: "Page Deleted", description: "The page and its associated paths have been deleted."});
      fetchPagesAndPaths();
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error });
    }
    setPageToDelete(null);
  }

  const handleAddPath = async (e: FormEvent, pageId: string) => {
      e.preventDefault();
      const pathValue = newPathValues[pageId];
      if (!pathValue) {
          toast({ variant: 'destructive', title: 'Error', description: 'Path cannot be empty.' });
          return;
      }
      
      const result = await addPath(pageId, pathValue);
       if (result.success) {
          toast({ title: "Path Added", description: `Added path ${pathValue}`});
          setNewPathValues(prev => ({ ...prev, [pageId]: '' }));
          fetchPagesAndPaths();
      } else {
          toast({ variant: "destructive", title: "Error", description: result.error });
      }
  };
  
  const handleDeletePath = async (pathId: string) => {
      const result = await deletePathAction(pathId);
       if (result.success) {
          toast({ title: "Path Deleted", description: "The path has been removed."});
          fetchPagesAndPaths();
      } else {
          toast({ variant: "destructive", title: "Error", description: result.error });
      }
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
              <CardContent>
                <Collapsible>
                  <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-start px-2">
                          <LinkIcon className="mr-2 h-4 w-4" />
                          <span>Paths ({page.paths.length})</span>
                      </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="p-4 bg-muted/50 rounded-md">
                        <div className="space-y-2">
                            {page.paths.map(path => (
                                <div key={path.id} className="flex items-center justify-between text-sm">
                                    <span className="font-mono bg-background px-2 py-1 rounded-sm">{path.path}</span>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeletePath(path.id)}>
                                        <X className="h-4 w-4"/>
                                    </Button>
                                </div>
                            ))}
                             {page.paths.length === 0 && <p className="text-sm text-muted-foreground">No paths are assigned to this page.</p>}
                        </div>
                        <form onSubmit={(e) => handleAddPath(e, page.id)} className="mt-4 flex gap-2">
                            <Input 
                                placeholder="/new-path"
                                value={newPathValues[page.id] || ''}
                                onChange={(e) => setNewPathValues(prev => ({...prev, [page.id]: e.target.value}))}
                                className="h-9"
                            />
                            <Button type="submit" size="sm">Add Path</Button>
                        </form>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
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
