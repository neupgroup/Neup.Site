
'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getDatalist, deleteDatalist } from '@/services/datalists';
import { Datalist } from '@/services/datalist/type';
import { Button } from '#/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '#/components/ui/card';
import { Skeleton } from '#/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '#/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '#/components/ui/alert-dialog';
import { AlertCircle, ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '#/core/hooks/useToast';
import { Textarea } from '#/components/ui/textarea';
import { Label } from '#/components/ui/label';
import { usePageTitle } from '#/core/hooks/use-page-title';

export default function ViewDatalistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [datalist, setDatalist] = useState<Datalist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  usePageTitle(datalist ? `Datalist: ${datalist.name}` : 'Datalist');

  useEffect(() => {
    const fetchDatalist = async () => {
      setLoading(true);
      const result = await getDatalist(id);
      if (result.success && result.datalist) {
        setDatalist(result.datalist);
      } else {
        setError(result.error || 'Failed to fetch datalist.');
      }
      setLoading(false);
    };
    fetchDatalist();
  }, [id]);

  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    const result = await deleteDatalist(id);
    if (result.success) {
      toast({ title: 'Datalist Deleted', description: 'The datalist has been permanently removed.' });
      router.push('/site/datalists');
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };

  if (loading) {
    return <Skeleton className="h-96 w-full max-w-2xl" />;
  }

  if (error || !datalist) {
    return (
      <Alert variant="destructive" className="max-w-2xl">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error || 'Datalist not found.'}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full max-w-2xl space-y-6">
       <Button asChild variant="plain" className="pl-0">
          <Link href="/site/datalists">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Datalists
          </Link>
        </Button>
      <Card>
        <CardHeader>
          <CardTitle>{datalist.name}</CardTitle>
          <CardDescription>ID: {datalist.id}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm">Created At</h4>
            <p className="text-muted-foreground">{datalist.createdAt ? new Date(datalist.createdAt).toLocaleString() : 'N/A'}</p>
          </div>
           <div>
            <h4 className="font-semibold text-sm">Last Updated</h4>
            <p className="text-muted-foreground">{datalist.updatedAt ? new Date(datalist.updatedAt).toLocaleString() : 'N/A'}</p>
          </div>
          <div>
            <Label className="text-sm font-semibold">Data (JSON)</Label>
            <Textarea
                readOnly
                value={datalist.data}
                rows={20}
                className="font-mono text-xs mt-1 bg-muted"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
            <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
            <Button asChild>
                <Link href={`/site/datalists/${datalist.id}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" /> Edit Datalist
                </Link>
            </Button>
        </CardFooter>
      </Card>
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this datalist.
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
