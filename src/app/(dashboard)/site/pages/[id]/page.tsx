
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSite, saveSite, deleteSite, type Site } from '@/actions/editor/site';
import type { CanvasElementData } from '@/lib/schemas';

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
import { AlertCircle, ArrowLeft, Pencil, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ViewPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { toast } = useToast();
  const router = useRouter();

  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);


  const fetchPage = useCallback(async () => {
    setLoading(true);
    const siteResult = await getSite(id);
    if (siteResult.success && siteResult.site) {
      setSite(siteResult.site);
    } else {
      setError(siteResult.error || 'Failed to load page content.');
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  const handleSectionVisibilityChange = async (sectionId: string, isVisible: boolean) => {
    if (!site) return;

    const updatedElements = site.elements.map(el => {
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
    
    const updatedSite = { ...site, elements: updatedElements };
    setSite(updatedSite); // Optimistic update

    setIsSaving(true);
    const result = await saveSite(id, updatedElements);
    if(result.success) {
        toast({ title: 'Section Updated!', description: `Section visibility has been saved.`});
    } else {
        toast({ variant: 'destructive', title: 'Error Saving', description: result.error });
        fetchPage(); // Revert on error
    }
    setIsSaving(false);
  };
  
  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    const result = await deleteSite(id);
    if (result.success) {
      toast({ title: "Page Deleted", description: "The page has been permanently deleted."});
      router.push('/site/pages');
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error });
    }
  }


  return (
    <div className="flex flex-col h-full space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Manage Page</CardTitle>
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
                <Link href={`/site/editor?mode=edit&id=${id}`}>
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
        <CardContent>
          {loading && (
            <div className="space-y-4">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {!loading && site && (
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        Page Sections
                        {isSaving && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                    </CardTitle>
                    <CardDescription>Control the visibility of each top-level section on this page.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {site.elements.length === 0 ? (
                        <p className="text-muted-foreground">This page has no sections yet.</p>
                    ) : (
                        <div className="border rounded-lg">
                           {site.elements.map((element, index) => (
                               <div key={element.id} className={`flex items-center justify-between p-4 ${index < site.elements.length - 1 ? 'border-b' : ''}`}>
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
          )}
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
