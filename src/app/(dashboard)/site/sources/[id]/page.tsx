
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSource, deleteSource, type Source } from '@/actions/editor/sources';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { AlertCircle, ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function SourceDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [source, setSource] = useState<Source | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchSource = async () => {
      setLoading(true);
      const result = await getSource(id);
      if (result.success && result.source) {
        setSource(result.source);
      } else {
        setError(result.error || 'Failed to fetch source.');
      }
      setLoading(false);
    };

    fetchSource();
  }, [id]);
  
  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    const result = await deleteSource(id);
    if(result.success) {
        toast({ title: 'Source Deleted', description: 'The data source has been removed.'});
        router.push('/site/sources');
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  }
  
  if (loading) {
    return (
        <Card className="w-full max-w-2xl">
            <CardHeader>
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
            </CardContent>
            <CardFooter className="flex justify-between">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
            </CardFooter>
        </Card>
    );
  }

  if (error || !source) {
    return (
      <Alert variant="destructive" className="max-w-2xl">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error || 'Source not found.'}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full max-w-2xl">
        <div className="mb-4">
            <Button variant="ghost" asChild>
                <Link href="/site/sources">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Sources
                </Link>
            </Button>
        </div>
        <Card>
            <CardHeader>
            <CardTitle>{source.name}</CardTitle>
            <CardDescription>ID: {source.id}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <h4 className="font-semibold text-sm">Base Path</h4>
                    <p className="text-muted-foreground font-mono text-sm">{source.basePath}</p>
                </div>
                 <div>
                    <h4 className="font-semibold text-sm">Created At</h4>
                    <p className="text-muted-foreground text-sm">{source.createdAt ? new Date(source.createdAt).toLocaleString() : 'N/A'}</p>
                </div>
                {/* Placeholder for methods and credentials */}
                <div className="border-t pt-4">
                    <h4 className="font-semibold text-sm mb-2">Methods</h4>
                    <p className="text-muted-foreground text-sm">Method management coming soon.</p>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                    <Trash2 className="mr-2 h-4 w-4"/> Delete
                </Button>
                <Button asChild>
                    <Link href={`/site/sources/${id}/edit`}>
                        <Pencil className="mr-2 h-4 w-4"/> Edit
                    </Link>
                </Button>
            </CardFooter>
        </Card>

        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the data source "{source.name}".
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
