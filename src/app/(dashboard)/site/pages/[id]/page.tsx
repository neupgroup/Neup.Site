
'use client';

import { useState, useEffect, useCallback, use, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { getPage, savePage, deletePage, type Page } from '@/actions/editor/pages';
import { getPathsForPage, addPath, deletePath as deletePathAction, type Path } from '@/actions/paths';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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

import Link from 'next/link';
import { AlertCircle, ArrowLeft, Pencil, Trash2, Eye, EyeOff, Loader2, Link as LinkIcon, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';


export default function ViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();
  const router = useRouter();

  const [page, setPage] = useState<Page | null>(null);
  const [paths, setPaths] = useState<Path[]>([]);
  const [newPathValue, setNewPathValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchPageData = useCallback(async () => {
    setLoading(true);
    const [pageResult, pathsResult] = await Promise.all([
        getPage(id),
        getPathsForPage(id)
    ]);
    
    if (pageResult.success && pageResult.page) {
      setPage(pageResult.page);
    } else {
      setError(pageResult.error || 'Failed to load page content.');
    }

    if (pathsResult.success && pathsResult.paths) {
        setPaths(pathsResult.paths);
    } else {
        // Don't set a page-level error for paths, just log it.
        console.error(pathsResult.error || 'Failed to load paths.');
    }

    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);
  
  const handleAddPath = async (e: FormEvent) => {
      e.preventDefault();
      if (!newPathValue) {
          toast({ variant: 'destructive', title: 'Error', description: 'Path cannot be empty.' });
          return;
      }
      
      const result = await addPath(id, newPathValue);
       if (result.success) {
          toast({ title: "Path Added", description: `Added path ${newPathValue}`});
          setNewPathValue('');
          fetchPageData();
      } else {
          toast({ variant: "destructive", title: "Error", description: result.error });
      }
  };
  
  const handleDeletePath = async (pathId: string) => {
      const result = await deletePathAction(pathId);
       if (result.success) {
          toast({ title: "Path Deleted", description: "The path has been removed."});
          fetchPageData();
      } else {
          toast({ variant: "destructive", title: "Error", description: result.error });
      }
  }

  const handleSectionVisibilityChange = async (sectionId: string, isVisible: boolean) => {
    if (!page) return;

    const updatedElements = page.elements.map(el => {
        if (el.id === sectionId) {
            return {
                ...el,
                properties: {
                    ...el.properties,
                    visibility: isVisible ? 'visible' : 'hidden',
                }
            };
        }
        return el;
    });
    
    const updatedPage = { ...page, elements: updatedElements };
    setPage(updatedPage); // Optimistic update

    setIsSaving(true);
    const result = await savePage(id, { elements: updatedElements });
    if(result.success) {
        toast({ title: 'Section Updated!', description: `Section visibility has been saved.`});
    } else {
        toast({ variant: 'destructive', title: 'Error Saving', description: result.error });
        fetchPageData(); // Revert on error
    }
    setIsSaving(false);
  };
  
  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    const result = await deletePage(id);
    if (result.success) {
      toast({ title: "Page Deleted", description: "The page has been permanently deleted."});
      router.push('/site/pages');
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error });
    }
  }

  if (loading) {
      return (
        <div className="flex flex-col h-full space-y-4">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-10 w-28" />
                        <Skeleton className="h-10 w-24" />
                        <Skeleton className="h-10 w-28" />
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-32 w-full" />
                </CardContent>
             </Card>
        </div>
      )
  }

  if (error || !page) {
      return (
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error || 'An unexpected error occurred.'}</AlertDescription>
        </Alert>
      )
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Manage Page: {page.name || page.id}</CardTitle>
            <CardDescription>Page ID: {id}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/site/pages">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Pages
              </Link>
            </Button>
            <Button asChild>
                <Link href={`/site/pages/${id}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Page
                </Link>
            </Button>
             <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Page
             </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        URL Paths
                    </CardTitle>
                    <CardDescription>The public URLs that will render this page.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        {paths.map(path => (
                            <div key={path.id} className="flex items-center justify-between text-sm p-2 bg-muted rounded-md">
                                <span className="font-mono">{path.path}</span>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeletePath(path.id)}>
                                    <X className="h-4 w-4"/>
                                </Button>
                            </div>
                        ))}
                         {paths.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No paths are assigned to this page.</p>}
                    </div>
                    <form onSubmit={handleAddPath} className="flex gap-2">
                        <Input 
                            placeholder="/new-path"
                            value={newPathValue}
                            onChange={(e) => setNewPathValue(e.target.value)}
                            className="h-9"
                        />
                        <Button type="submit" size="sm">Add Path</Button>
                    </form>
                </CardContent>
             </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        Page Sections
                        {isSaving && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                    </CardTitle>
                    <CardDescription>Control the visibility of each top-level section on this page.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {page.elements.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">This page has no sections yet. Go to 'Edit Page' to add content.</p>
                    ) : (
                        <div className="border rounded-lg">
                           {page.elements.map((element, index) => (
                               <div key={element.id} className={`flex items-center justify-between p-4 ${index < page.elements.length - 1 ? 'border-b' : ''}`}>
                                   <span className="font-mono text-sm">{element.id} ({element.type})</span>
                                   <div className="flex items-center gap-2">
                                       <Switch
                                            id={`visibility-${element.id}`}
                                            checked={element.properties?.visibility !== 'hidden'}
                                            onCheckedChange={(checked) => handleSectionVisibilityChange(element.id, checked)}
                                        />
                                        <Label htmlFor={`visibility-${element.id}`} className="flex items-center gap-1.5 text-sm">
                                            {element.properties?.visibility !== 'hidden' ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                                            {element.properties?.visibility !== 'hidden' ? 'Visible' : 'Hidden'}
                                        </Label>
                                   </div>
                               </div>
                           ))}
                        </div>
                    )}
                </CardContent>
             </Card>
        </CardContent>
      </Card>
      
       <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this page and remove it from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
