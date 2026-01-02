
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
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
import { useToast } from '@/hooks/use-toast';
import { getEnvironmentVariables, deleteEnvironmentVariable, type EnvironmentVariable } from '@/actions/environment';
import { FileLock, Plus, Trash2, AlertCircle } from 'lucide-react';
import { usePageTitle } from '@/hooks/use-page-title';
import Link from 'next/link';

export default function EnvironmentPage() {
  usePageTitle('Environments');
  const [variables, setVariables] = useState<EnvironmentVariable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [variableToDelete, setVariableToDelete] = useState<EnvironmentVariable | null>(null);
  const { toast } = useToast();

  const fetchVariables = useCallback(async () => {
    setLoading(true);
    const result = await getEnvironmentVariables();
    if (result.success && result.variables) {
      setVariables(result.variables);
    } else {
      setError(result.error || 'Failed to load environment variables.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchVariables();
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

      <Card>
        <CardHeader>
          <CardTitle>Your Variables</CardTitle>
          <CardDescription>All environment variables for this site.</CardDescription>
        </CardHeader>
        <CardContent>
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
                    <div key={variable.id} className="p-3 bg-muted/50 rounded-md hover:bg-muted flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border">
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
        </CardContent>
      </Card>
    </div>
  );
}
