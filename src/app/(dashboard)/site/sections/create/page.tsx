
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { saveSection } from '@/actions/editor/sections';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2, ArrowLeft } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { z } from 'zod';
import Link from 'next/link';

const formSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    type: z.string().min(1, 'Type is required'),
    content: z.string().refine((val) => {
        try {
            JSON.parse(val);
            return true;
        } catch (e) {
            return false;
        }
    }, { message: 'Content must be valid JSON.' }),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateSectionPage() {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        name: '',
        type: '',
        content: '[]',
    }
  });
  
  const onSubmit = async (data: FormValues) => {
    const result = await saveSection({ 
        ...data,
        createdBy: 'user',
        source: 'json',
    });

    if (result.success && result.id) {
        toast({ title: 'Section Created!', description: 'The new section has been saved.' });
        router.push(`/site/sections`);
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };

  return (
    <Form {...form}>
        <div className="flex justify-start mb-4">
            <Button variant="ghost" asChild>
                <Link href="/site/sections">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Sections
                </Link>
            </Button>
        </div>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-2xl space-y-6">
            <Card>
                <CardHeader>
                  <CardTitle>Create New Section</CardTitle>
                  <CardDescription>
                    Define a new reusable section.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Section Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 'Pricing Table'" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Section Type / Category</FormLabel>
                          <FormControl>
                             <Input placeholder="e.g., 'Hero', 'FAQ'" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Content (JSON)</FormLabel>
                          <FormControl>
                             <Textarea placeholder="Enter the JSON structure for this section..." {...field} rows={15} className="font-mono" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {form.formState.isSubmitting ? 'Saving...' : 'Save Section'}
                  </Button>
                </CardFooter>
            </Card>
        </form>
    </Form>
  );
}
