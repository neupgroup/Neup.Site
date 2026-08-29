
'use client';

import { useEffect, use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getDatalist, updateDatalist } from '@/services/datalists';
import { Datalist } from '@/services/datalist/type';
import { Button } from '#/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '#/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '#/components/ui/form';
import { Input } from '#/components/ui/input';
import { Textarea } from '#/components/ui/textarea';
import { Skeleton } from '#/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '#/components/ui/alert';
import { useToast } from '#/core/hooks/useToast';
import { Save, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import Link from 'next/link';
import { usePageTitle } from '#/core/hooks/use-page-title';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  data: z.string().refine((val) => {
    try {
      JSON.parse(val);
      return true;
    } catch (e) {
      return false;
    }
  }, { message: 'Data must be valid JSON.' }),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditDatalistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [datalist, setDatalist] = useState<Datalist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  usePageTitle(datalist ? `Edit: ${datalist.name}` : 'Edit Datalist');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      data: '[]',
    },
  });

  useEffect(() => {
    const fetchDatalist = async () => {
        setLoading(true);
        const result = await getDatalist(id);
        if (result.success && result.datalist) {
            setDatalist(result.datalist);
            form.reset({
              name: result.datalist.name,
              data: result.datalist.data,
            });
        } else {
            setError(result.error || 'Failed to fetch allocation details.');
        }
        setLoading(false);
    }
    fetchDatalist();
  }, [id, form]);

  const onSubmit = async (data: FormValues) => {
    const result = await updateDatalist(id, data);
    
    if (result.success) {
      toast({ title: 'Datalist Updated', description: 'The datalist has been saved.' });
      router.push(`/site/datalists/${id}`);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };

  if (loading) {
      return (
          <Card className="max-w-2xl">
              <CardHeader><Skeleton className="h-8 w-1/3" /></CardHeader>
              <CardContent className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-24 w-full" />
              </CardContent>
              <CardFooter><Skeleton className="h-10 w-32" /></CardFooter>
          </Card>
      )
  }

  if (error) {
      return (
          <Alert variant="destructive" className="max-w-2xl">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
          </Alert>
      )
  }


  return (
    <Form {...form}>
      <div className="flex justify-start mb-4">
        <Button variant="plain" asChild>
            <Link href={`/site/datalists/${id}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Datalist
            </Link>
        </Button>
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-2xl">
        <Card>
            <CardHeader>
                <CardTitle>Edit Datalist</CardTitle>
                <CardDescription>Modify the details of your custom data collection.</CardDescription>
            </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Datalist Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 'Pricing Table'" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
                control={form.control}
                name="data"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Data (JSON)</FormLabel>
                    <FormControl>
                        <Textarea placeholder="Enter the JSON structure..." {...field} rows={20} className="font-mono" />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
          </CardContent>
          <CardFooter>
            <Button variant="primary" type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
