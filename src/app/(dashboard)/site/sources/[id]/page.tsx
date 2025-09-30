
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
import { AlertCircle, ArrowLeft, Pencil, Trash2, Code } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

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
        <Card className="w-full max-w-4xl">
            <CardHeader>
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Separator />
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-20 w-full" />
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
    <div className="w-full max-w-4xl">
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
            <CardContent className="space-y-6">
                <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Base Path</h4>
                    <p className="font-mono text-sm">{source.basePath}</p>
                </div>
                 <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Created At</h4>
                    <p className="text-sm">{source.createdAt ? new Date(source.createdAt).toLocaleString() : 'N/A'}</p>
                </div>
                
                <Separator />

                <div>
                    <h3 className="text-lg font-semibold mb-4">Methods</h3>
                    {source.methods && source.methods.length > 0 ? (
                        <div className="space-y-4">
                            {source.methods.map((method, index) => (
                                <Card key={index} className="bg-muted/50">
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Code className="h-5 w-5 text-primary" />
                                            {method.methodName}
                                        </CardTitle>
                                        <CardDescription>{method.subPath}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-sm">
                                        <p><strong className="text-muted-foreground">Details:</strong> {method.moreDetails}</p>
                                        <p><strong className="text-muted-foreground">Success Format:</strong> <code className="text-xs">{method.responseFormat.correct}</code></p>
                                        <p><strong className="text-muted-foreground">Error Format:</strong> <code className="text-xs">{method.responseFormat.incorrect}</code></p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-sm">No methods have been defined for this source yet.</p>
                    )}
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
