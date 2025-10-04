
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { saveTemplate } from '@/actions/editor/templates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { z } from 'zod';

const formSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    type: z.enum(['section', 'page', 'element']),
    usableOn: z.array(z.enum(['json', 'react'])).min(1, 'Select at least one usage target'),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateTemplatePage() {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        name: '',
        description: '',
        type: 'section',
        usableOn: ['json'],
    }
  });
  
  const handleManualSave = async (data: FormValues) => {
    const result = await saveTemplate({ 
        ...data,
        createdBy: 'user',
        content: {},
    });

    if (result.success && result.id) {
        toast({ title: 'Template Created!', description: 'Now, let\'s define its content.' });
        router.push(`/root/templates/${result.id}/edit/content`);
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };

  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(handleManualSave)} className="w-full max-w-2xl space-y-6">
            <Card>
                <CardHeader>
                  <CardTitle>Create New Template</CardTitle>
                  <CardDescription>
                    Define the basic information for your new reusable component. You'll add content in the next step.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Template Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 'Primary Button'" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                             <Textarea placeholder="A short description of this template" {...field} />
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
                          <FormLabel>Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a template type" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="section">Section</SelectItem>
                                <SelectItem value="page">Page</SelectItem>
                                <SelectItem value="element">Element</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                        control={form.control}
                        name="usableOn"
                        render={() => (
                            <FormItem>
                                <div className="mb-4">
                                    <FormLabel>Usable On</FormLabel>
                                    <FormDescription>
                                        Where can this template be used?
                                    </FormDescription>
                                </div>
                                <div className="flex gap-8">
                                <FormField
                                    control={form.control}
                                    name="usableOn"
                                    render={({ field }) => {
                                    return (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                            <FormControl>
                                                <Checkbox
                                                checked={field.value?.includes("json")}
                                                onCheckedChange={(checked) => {
                                                    return checked
                                                    ? field.onChange([...field.value, "json"])
                                                    : field.onChange(
                                                        field.value?.filter(
                                                        (value) => value !== "json"
                                                        )
                                                    )
                                                }}
                                                />
                                            </FormControl>
                                            <FormLabel className="font-normal">
                                                Editor (JSON)
                                            </FormLabel>
                                        </FormItem>
                                    )}}
                                />
                                <FormField
                                    control={form.control}
                                    name="usableOn"
                                    render={({ field }) => {
                                    return (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                            <FormControl>
                                                <Checkbox
                                                checked={field.value?.includes("react")}
                                                onCheckedChange={(checked) => {
                                                    return checked
                                                    ? field.onChange([...field.value, "react"])
                                                    : field.onChange(
                                                        field.value?.filter(
                                                        (value) => value !== "react"
                                                        )
                                                    )
                                                }}
                                                />
                                            </FormControl>
                                            <FormLabel className="font-normal">
                                                Codebase (React)
                                            </FormLabel>
                                        </FormItem>
                                    )}}
                                />
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                    {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {form.formState.isSubmitting ? 'Saving...' : 'Save and Continue'}
                  </Button>
                </CardFooter>
            </Card>
        </form>
    </Form>
  );
}
