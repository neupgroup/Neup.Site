
'use client';

import { useState, useEffect, useCallback, use, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { getPage, savePage, deletePage, type Page } from '@/services/editor/pages';
import { getPathsForPage, addPath, deletePath as deletePathAction, type Path } from '@/services/paths';
import { convertJsonToHtml } from '@/lib/json-to-html';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
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
import { AlertCircle, ArrowLeft, Pencil, Trash2, Eye, EyeOff, Loader2, Settings, X, Save, Layers } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';


export default function ViewPage({ params }: { params: { id: string } }) {
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
  const [isPreviewVisible, setIsPreviewVisible] = useState(true);

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
  
  const htmlContent = page ? convertJsonToHtml(page.elements) : '';

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
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Skeleton className="h-48 w-full" />
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
                    Edit Content
                </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="pageName">Page Name</Label>
                <Input id="pageName" value={pageName} onChange={(e) => setPageName(e.target.value)} />
            </div>

            <div className="space-y-4">
                <Label>URL Paths</Label>
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
            </div>
            
            <div className="flex justify-between items-center pt-6 border-t">
                <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Page
                </Button>
                <Button onClick={handleSaveSettings} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Settings
                </Button>
            </div>

        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Page Sections</CardTitle>
          <CardDescription>The sections and elements that make up this page.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {page.elements.map((element, index) => (
              <div key={element.id || index} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-sm">{element.id} ({element.type})</span>
                </div>
              </div>
            ))}
            {page.elements.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <p>This page has no content yet. Edit the page to add sections.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
       <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Live Preview</CardTitle>
          <div className="flex items-center space-x-2">
            <Switch
              id="preview-mode"
              checked={isPreviewVisible}
              onCheckedChange={setIsPreviewVisible}
            />
            <Label htmlFor="preview-mode">
              {isPreviewVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Label>
          </div>
        </CardHeader>
        {isPreviewVisible && (
          <CardContent>
            <div className="relative w-full h-[60vh] border rounded-md">
              <iframe
                srcDoc={htmlContent}
                title="Page Preview"
                className="w-full h-full"
              />
            </div>
          </CardContent>
        )}
      </Card>
      
       <AlertDialog open={showDeleteConfirm} onOpenChange={(open) => !open && setShowDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will delete the page and all its data. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowDeleteConfirm(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
