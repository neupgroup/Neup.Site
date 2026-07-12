
'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSection, deleteSection, type Section } from '@/services/editor/sections';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AlertCircle, ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/core/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function ViewSectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [section, setSection] = useState<Section | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchSection = async () => {
      if (!id) return;
      setLoading(true);
      const result = await getSection(id);
      if (result.success && result.section) {
        setSection(result.section);
      } else {
        setError(result.error || 'Failed to fetch section.');
      }
      setLoading(false);
    };
    fetchSection();
  }, [id]);

  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    const result = await deleteSection(id);
    if (result.success) {
      toast({ title: 'Section Deleted', description: 'The section has been permanently removed.' });
      router.push('/site/sections');
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };

  if (loading) {
    return <Skeleton className="h-96 w-full max-w-2xl" />;
  }

  if (error || !section) {
    return (
      <Alert variant="destructive" className="max-w-2xl">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error || 'Section not found.'}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full max-w-2xl space-y-6">
       <Button asChild variant="plain" className="pl-0">
          <Link href="/site/sections">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sections
          </Link>
        </Button>
      <Card>
        <CardHeader>
          <CardTitle>{section.name}</CardTitle>
          <CardDescription>ID: {section.id}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm">Type</h4>
            <p className="text-muted-foreground">{section.type || 'N/A'}</p>
          </div>
          <div>
            <h4 className="font-semibold text-sm">Created By</h4>
            <p className="text-muted-foreground capitalize">{section.createdBy}</p>
          </div>
          <div>
            <h4 className="font-semibold text-sm">Created At</h4>
            <p className="text-muted-foreground">{section.createdAt ? new Date(section.createdAt).toLocaleString() : 'N/A'}</p>
          </div>
          <div>
            <Label className="text-sm font-semibold">Content (JSON)</Label>
            <Textarea
                readOnly
                value={section.content}
                rows={15}
                className="font-mono text-xs mt-1"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
            <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
            <Button asChild>
                <Link href={`/site/sections/${section.id}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" /> Edit Section
                </Link>
            </Button>
        </CardFooter>
      </Card>
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this section.
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
