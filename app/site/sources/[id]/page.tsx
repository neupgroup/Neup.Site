
'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { getSource, deleteSource, type Source, ApiSource, DatabaseSource, StaticSource, DatalistSource } from '@/services/editor/sources';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '#/components/ui/card';
import { Button } from '#/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '#/components/ui/alert-dialog';
import { AlertCircle, ArrowLeft, Pencil, Trash2, Code } from 'lucide-react';
import { useToast } from '#/core/hooks/useToast';
import Link from 'next/link';
import { Skeleton } from '#/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '#/components/ui/alert';
import { Separator } from '#/components/ui/separator';
import { Badge } from '#/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#/components/ui/table';

const DetailItem = ({ label, value }: { label: string, value: string | undefined | null }) => {
    if (!value) return null;
    return (
        <div>
            <h4 className="font-semibold text-sm text-muted-foreground">{label}</h4>
            <p className="font-mono text-sm break-all">{value}</p>
        </div>
    )
};

export default function SourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
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
            <CardFooter className="flex justify-end gap-2">
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
    <div className="w-full max-w-4xl space-y-6">
        <div className="mb-4">
            <Button type="plain" asChild>
                <Link href="/site/sources">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Sources
                </Link>
            </Button>
        </div>
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>{source.name}</CardTitle>
                        <CardDescription>ID: {source.id}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline">{source.type}</Badge>
                         <Button asChild type="outlined" size="sm">
                            <Link href={`/site/sources/${id}/edit`}>
                                <Pencil className="mr-2 h-4 w-4"/> Edit
                            </Link>
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <DetailItem label="Created At" value={source.createdAt ? new Date(source.createdAt).toLocaleString() : 'N/A'} />

                <Separator />

                <h3 className="text-lg font-semibold">Configuration</h3>

                {source.type === 'api' && (
                    <div className="space-y-4">
                        <DetailItem label="URL" value={(source as ApiSource).url} />
                    </div>
                )}
                 {source.type === 'database' && (
                    <div className="space-y-4">
                        <DetailItem label="Connection" value={(source as DatabaseSource).connection} />
                    </div>
                )}
                 {source.type === 'static' && (
                    <div className="space-y-2">
                       <h4 className="font-semibold text-sm text-muted-foreground">Data</h4>
                       <pre className="text-xs bg-muted p-4 rounded-md overflow-x-auto">
                           <code>{JSON.stringify((source as StaticSource).data, null, 2)}</code>
                       </pre>
                    </div>
                )}
                {source.type === 'datalist' && (
                    <div className="space-y-4">
                        <DetailItem label="Datalist ID" value={(source as DatalistSource).datalistId} />
                    </div>
                )}
            </CardContent>
        </Card>

        <Card>
             <CardHeader>
                <CardTitle>Methods</CardTitle>
                <CardDescription>Available functions for this data source.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Path / Query</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {source.methods && source.methods.length > 0 ? (
                            source.methods.map((method, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-mono">{method.methodName}</TableCell>
                                    <TableCell className="font-mono">{method.path}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center text-muted-foreground h-24">No methods defined.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
             <CardFooter className="flex justify-end gap-2">
                <Button type="solid" convey="danger" onClick={() => setShowDeleteConfirm(true)}>
                    <Trash2 className="mr-2 h-4 w-4"/> Delete Source
                </Button>
                {source.type === 'api' && (
                     <Button asChild>
                        <Link href={`/site/sources/${id}/edit/methods`}>
                            <Code className="mr-2 h-4 w-4"/> Edit Methods
                        </Link>
                    </Button>
                )}
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
