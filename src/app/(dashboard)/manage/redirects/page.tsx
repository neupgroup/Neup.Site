
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { createRedirect, getRedirects, deleteRedirect, type Redirect } from '@/actions/redirects';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Redo, AlertCircle, Plus, Loader2, Save, Trash2, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const formSchema = z.object({
  from: z.string().min(1, 'From path is required.').refine(p => p.startsWith('/'), "Path must start with a '/'"),
  to: z.string().url({ message: "Must be a valid URL." }),
  type: z.enum(['temporary', 'permanent']),
});

type FormValues = z.infer<typeof formSchema>;

export default function RedirectsPage() {
  const { toast } = useToast();
  const [redirects, setRedirects] = useState<Redirect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      from: '/',
      to: '',
      type: 'permanent',
    },
  });

  const { isSubmitting } = form.formState;

  const fetchRedirects = async () => {
    setLoading(true);
    const result = await getRedirects();
    if (result.success && result.redirects) {
      setRedirects(result.redirects);
    } else {
      setError(result.error || 'Failed to fetch redirects');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRedirects();
  }, []);

  const onSubmit = async (data: FormValues) => {
    const result = await createRedirect(data);
    if (result.success) {
      toast({ title: 'Redirect Created' });
      form.reset();
      fetchRedirects(); // Refresh the list
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };
  
  const handleDelete = async (id: string) => {
    const originalRedirects = [...redirects];
    setRedirects(prev => prev.filter(r => r.id !== id));
    
    const result = await deleteRedirect(id);
    if (!result.success) {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
      setRedirects(originalRedirects);
    } else {
      toast({ title: 'Redirect Deleted' });
    }
  }

  return (
    <div className="w-full space-y-8">
      <header className="flex items-center justify-between">
        <div>
            <h1 className="font-headline text-2xl font-semibold tracking-tight">Redirects</h1>
            <p className="text-muted-foreground">Create and manage URL redirects for your site.</p>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Create New Redirect</CardTitle>
          <CardDescription>
            Forward an incoming path to another URL.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                        <FormField control={form.control} name="from" render={({ field }) => (
                            <FormItem>
                                <FormLabel>From</FormLabel>
                                <div className="flex items-center">
                                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground sm:text-sm h-10">
                                        yourdomain.com
                                    </span>
                                    <FormControl>
                                        <Input {...field} placeholder="/old-page" className="rounded-l-none" />
                                    </FormControl>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )} />
                         <FormField control={form.control} name="to" render={({ field }) => (
                            <FormItem>
                                <FormLabel>To</FormLabel>
                                <FormControl><Input {...field} placeholder="https://example.com/new-page" /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between items-end">
                    <FormField control={form.control} name="type" render={({ field }) => (
                        <FormItem className="w-48">
                            <FormLabel>Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="permanent">Permanent (301)</SelectItem>
                                    <SelectItem value="temporary">Temporary (302)</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 animate-spin" /> : <Save className="mr-2" />}
                        Save Redirect
                    </Button>
                </CardFooter>
            </form>
        </Form>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Existing Redirects</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : redirects.length === 0 ? (
            <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
              <Redo className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p>No redirects created yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {redirects.map((redirect) => (
                  <TableRow key={redirect.id}>
                    <TableCell className="font-mono">{redirect.from}</TableCell>
                    <TableCell className="font-mono max-w-xs truncate"><a href={redirect.to} target="_blank" rel="noopener noreferrer" className="hover:underline">{redirect.to}</a></TableCell>
                    <TableCell><Badge variant={redirect.type === 'permanent' ? 'default' : 'secondary'}>{redirect.type === 'permanent' ? '301' : '302'}</Badge></TableCell>
                    <TableCell>{redirect.created_on ? format(new Date(redirect.created_on), 'PP') : 'N/A'}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(redirect.id)}>
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
