'use client';

import { useState, useEffect, useCallback, use, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { getPage, savePage, deletePage } from '@/actions/editor/pages';
import { Page } from '@/schemas/site'; // Corrected import
import { getPathsForPage, addPath, deletePath as deletePathAction, type Path } from '@/actions/paths';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { AlertCircle, ArrowLeft, Trash2, Loader2, Link as LinkIcon, X, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function PageSettingsPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { toast } = useToast();
  const router = useRouter();

  const [page, setPage] = useState<Page | null>(null);
  const [pageName, setPageName] = useState('');
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
      setPageName(pageResult.page.name || '');
    } else {
      setError(pageResult.error || 'Failed to load page content.');
    }

    if (pathsResult.success && pathsResult.paths) {
        setPaths(pathsResult.paths);
    } else {
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

  const handleSaveSettings = async () => {
    if (!page) return;
    setIsSaving(true);
    const result = await savePage(id, { name: pageName });
    if(result.success) {
        toast({ title: 'Page Updated!', description: `The page settings have been saved.`});
    } else {
        toast({ variant: 'destructive', title: 'Error Saving', description: result.error });
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
                <CardHeader>
                    <Skeleton className="h-8 w-48" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <Skeleton className="h-10 w-full" />
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
    <div className="w-full max-w-2xl space-y-6">
        <Button asChild variant="ghost">
            <Link href={`/site/pages/${id}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Page
            </Link>
        </Button>
        <Card>
            <CardHeader>
                <CardTitle>Page Settings</CardTitle>
                <CardDescription>Manage the name and URL paths for this page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="pageName">Page Name</Label>
                    <Input id="pageName" value={pageName} onChange={(e) => setPageName(e.target.value)} />
                </div>
            </CardContent>
        </Card>
        
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

        <div className="flex justify-between items-center p-4 border rounded-lg">
            <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Page
             </Button>
            <Button onClick={handleSaveSettings} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Settings
            </Button>
        </div>

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