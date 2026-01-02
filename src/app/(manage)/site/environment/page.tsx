
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { getEnvironmentVariables, createEnvironmentVariable, deleteEnvironmentVariable, type EnvironmentVariable } from '@/actions/environment';
import { FileLock, Plus, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { usePageTitle } from '@/hooks/use-page-title';

const formSchema = z.object({
  name: z.string().min(1, 'Variable name is required'),
  value: z.string().min(1, 'Value is required'),
  dataType: z.enum(['string', 'number', 'boolean']),
  isPrivate: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

const formatVariableName = (name: string) => {
  return name
    .replace(/([a-z])([A-Z])/g, '$1_$2') // camelCase to snake_case
    .replace(/[\s-]/g, '_') // spaces and hyphens to underscores
    .toUpperCase();
};

export default function EnvironmentPage() {
  usePageTitle('Environments');
  const [variables, setVariables] = useState<EnvironmentVariable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [variableToDelete, setVariableToDelete] = useState<EnvironmentVariable | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      value: '',
      dataType: 'string',
      isPrivate: true,
    },
  });

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
  
  const onSubmit = async (data: FormValues) => {
    const formattedName = formatVariableName(data.name);
    const result = await createEnvironmentVariable({ ...data, name: formattedName });
    if (result.success) {
      toast({ title: "Variable Added", description: `Variable ${formattedName} has been saved.`});
      form.reset();
      fetchVariables();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  }

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

      <header>
        <h1 className="font-headline text-2xl font-semibold tracking-tight">Environments</h1>
        <p className="text-muted-foreground">Manage your site's environment variables.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Add Variable</CardTitle>
          <CardDescription>Add a new environment variable. The name will be automatically converted to UPPER_SNAKE_CASE.</CardDescription>
        </CardHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} placeholder="My Variable Name" /></FormControl><FormMessage /></FormItem>
                        )}/>
                         <FormField control={form.control} name="value" render={({ field }) => (
                            <FormItem><FormLabel>Value</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="dataType" render={({ field }) => (
                            <FormItem><FormLabel>Data Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="string">String</SelectItem>
                                    <SelectItem value="number">Number</SelectItem>
                                    <SelectItem value="boolean">Boolean</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage /></FormItem>
                        )}/>
                         <FormField control={form.control} name="isPrivate" render={({ field }) => (
                            <FormItem className="flex flex-col pt-2"><FormLabel>Private</FormLabel>
                                <div className="flex items-center gap-2 pt-2.5">
                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                <span className="text-sm text-muted-foreground">Is this a sensitive value?</span>
                                </div>
                            <FormMessage /></FormItem>
                        )}/>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? <Loader2 className="mr-2 animate-spin" /> : <Plus className="mr-2" />}
                        Add Variable
                    </Button>
                </CardFooter>
            </form>
        </Form>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Your Variables</CardTitle>
          <CardDescription>All environment variables for this site.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-40 w-full" />
          ) : error ? (
            <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>
          ) : variables.length === 0 ? (
            <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
                <FileLock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p>No environment variables set yet.</p>
            </div>
          ) : (
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {variables.map(variable => (
                        <TableRow key={variable.id}>
                            <TableCell className="font-mono">{variable.name}</TableCell>
                            <TableCell className="font-mono">{variable.isPrivate ? '••••••••••' : variable.value}</TableCell>
                            <TableCell>{variable.dataType}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => setVariableToDelete(variable)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
             </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
