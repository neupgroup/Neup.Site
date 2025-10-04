
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getTemplate, saveTemplate, type Template } from '@/actions/editor/templates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2, AlertCircle } from 'lucide-react';
import { z } from 'zod';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.enum(['section', 'page', 'element']),
  status: z.enum(['draft', 'published']),
  usableOn: z.array(z.enum(['json', 'react'])).min(1, 'Select at least one usage target'),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditBasicsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'section',
      status: 'draft',
      usableOn: ['json'],
    },
  });

  useEffect(() => {
    const fetchTemplate = async () => {
      setLoading(true);
      const templateResult = await getTemplate(id);

      if (templateResult.success && templateResult.template) {
        setTemplate(templateResult.template);
        form.reset({
          name: templateResult.template.name,
          description: templateResult.template.description,
          type: templateResult.template.type,
          status: templateResult.template.status,
          usableOn: templateResult.template.usableOn || ['json'],
        });
      } else {
        setError(templateResult.error || 'Failed to load template.');
      }
      setLoading(false);
    };

    fetchTemplate();
  }, [id, form]);

  const onSubmit = async (data: FormValues) => {
    if (!template) return;
    const result = await saveTemplate({
      ...template,
      ...data,
    }, id);
    
    if (result.success) {
      toast({ title: 'Template Updated', description: 'The basic information has been saved.' });
      router.refresh();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };

  if (loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardContent className="space-y-4 pt-6">
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
            <div className="grid grid-cols-2 gap-4">
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
                    name="status"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a status" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="published">Published</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
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
            <Button type="submit" disabled={form.formState.isSubmitting}>
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
