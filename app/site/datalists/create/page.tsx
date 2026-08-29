
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createDatalist } from '@/services/datalists';
import { Button } from '#/components/ui/buttons';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '#/components/ui/card';
import { Input } from '#/components/ui/input';
import { Textarea } from '#/components/ui/textarea';
import { useToast } from '#/core/hooks/useToast';
import { Save, Loader2, ArrowLeft } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '#/components/ui/form';
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

export default function CreateDatalistPage() {
  usePageTitle('Create Datalist');
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      data: '[\n  {\n    "id": 1,\n    "name": "Item 1"\n  }\n]',
    }
  });
  
  const onSubmit = async (data: FormValues) => {
    const result = await createDatalist(data);

    if (result.success && result.id) {
      toast({ title: 'Datalist Created!', description: 'The new datalist has been saved.' });
      router.push(`/site/datalists`);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };

  return (
    <Form {...form}>
      <div className="flex justify-start mb-4">
        <Button variant="plain" asChild>
          <Link href="/site/datalists">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Datalists
          </Link>
        </Button>
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Create New Datalist</CardTitle>
            <CardDescription>
              Define a new collection of data that can be used on your pages.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Datalist Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 'Blog Posts'" {...field} />
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
                  <FormLabel>Data (JSON Array)</FormLabel>
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
              {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {form.formState.isSubmitting ? 'Saving...' : 'Save Datalist'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
