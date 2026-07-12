
'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getTemplate, deleteTemplate, type Template } from '@/services/editor/templates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AlertCircle, ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/core/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/core/utils';
import { usePageTitle } from '@/core/hooks/use-page-title';

export default function ViewTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  usePageTitle(template ? `Template: ${template.name}` : 'View Template', 'NeupSites');

  useEffect(() => {
    const fetchTemplate = async () => {
      setLoading(true);
      const result = await getTemplate(id);
      if (result.success && result.template) {
        setTemplate(result.template);
      } else {
        setError(result.error || 'Failed to fetch template.');
      }
      setLoading(false);
    };
    fetchTemplate();
  }, [id]);

  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    const result = await deleteTemplate(id);
    if (result.success) {
      toast({ title: 'Template Deleted', description: 'The template has been permanently removed.' });
      router.push('/root/templates');
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };

  if (loading) {
    return <Skeleton className="h-96 w-full max-w-2xl" />;
  }

  if (error || !template) {
    return (
      <Alert variant="destructive" className="max-w-2xl">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error || 'Template not found.'}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full max-w-2xl space-y-6">
       <Button asChild variant="plain">
          <Link href="/root/templates">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Templates
          </Link>
        </Button>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
                <CardTitle>{template.name}</CardTitle>
                <CardDescription>ID: {template.id}</CardDescription>
            </div>
            <Badge variant={template.status === 'published' ? 'default' : 'secondary'} className={cn(template.status === 'published' && 'bg-green-600')}>{template.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm">Description</h4>
            <p className="text-muted-foreground">{template.description || 'N/A'}</p>
          </div>
          <div>
            <h4 className="font-semibold text-sm">Type</h4>
            <p className="text-muted-foreground capitalize">{template.type}</p>
          </div>
           <div>
            <h4 className="font-semibold text-sm">Created By</h4>
            <p className="text-muted-foreground capitalize">{template.createdBy || 'N/A'}</p>
          </div>
          <div>
            <h4 className="font-semibold text-sm">Created At</h4>
            <p className="text-muted-foreground">{template.createdAt ? new Date(template.createdAt).toLocaleString() : 'N/A'}</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
            <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
            <Button asChild>
                <Link href={`/root/templates/${template.id}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" /> Edit Template
                </Link>
            </Button>
        </CardFooter>
      </Card>
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this template.
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
