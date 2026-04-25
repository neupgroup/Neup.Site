
'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
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
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/core/hooks/use-toast';
import { getEnvironmentVariables, deleteEnvironmentVariable, type EnvironmentVariable } from '@/services/environment';
import { FileLock, Plus, Trash2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePageTitle } from '@/core/hooks/use-page-title';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CardFooter } from '@/components/ui/card';

export default function EnvironmentPage() {
  usePageTitle('Environments');
  const [variables, setVariables] = useState<EnvironmentVariable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [variableToDelete, setVariableToDelete] = useState<EnvironmentVariable | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const { toast } = useToast();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPage = Number(searchParams.get('page')) || 1;
  const pageSize = 10;
  const [isPending, startTransition] = useTransition();

  const fetchVariables = useCallback(async () => {
    setLoading(true);
    const result = await getEnvironmentVariables({ page: currentPage, pageSize });
    if (result.success && result.variables) {
      setVariables(result.variables);
      setTotalCount(result.totalCount || 0);
    } else {
      setError(result.error || 'Failed to load environment variables.');
    }
    setLoading(false);
  }, [currentPage, pageSize]);

  useEffect(() => {
    startTransition(() => {
        fetchVariables();
    });
  }, [fetchVariables]);

  const handleDelete = async () => {
    if (!variableToDelete) return;
    const result = await deleteEnvironmentVariable(variableToDelete.id);
    if (result.success) {
        toast({ title: 'Variable Deleted' });
        fetchVariables();
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
    setVariableToDelete(null);
  }
  
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="w-full space-y-6">
       <AlertDialog open={!!variableToDelete} onOpenChange={() => setVariableToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete the <strong>{variableToDelete?.name}</strong> variable. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

      <header className="flex items-center justify-between">
        <div>
            <h1 className="font-headline text-2xl font-semibold tracking-tight">Environments</h1>
            <p className="text-muted-foreground">Manage your site's environment variables.</p>
        </div>
        <Button asChild>
            <Link href="/site/environment/create">
                <Plus className="mr-2 h-4 w-4"/> Create Variable
            </Link>
        </Button>
      </header>

      {loading ? (
        <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
        </div>
      ) : error ? (
        <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>
      ) : variables.length === 0 ? (
        <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
            <FileLock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p>No environment variables set yet.</p>
        </div>
      ) : (
          <div className="space-y-2">
            {variables.map(variable => (
                <div key={variable.id} className="p-3 bg-card border rounded-md hover:bg-muted flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm">{variable.name}</p>
                        <p className="font-mono text-xs text-muted-foreground">{variable.isPrivate ? '••••••••••' : variable.value}</p>
                    </div>
                    <div className="flex items-center gap-4 self-end sm:self-center">
                        <span className="text-xs text-muted-foreground capitalize">{variable.dataType}</span>
                        <Button variant="ghost" size="icon" onClick={() => setVariableToDelete(variable)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                </div>
            ))}
          </div>
      )}

      {totalPages > 1 && (
            <CardFooter className="flex items-center justify-between px-0">
                <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1 || isPending}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages || isPending}
                    >
                        Next
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardFooter>
        )}
    </div>
  );
}
