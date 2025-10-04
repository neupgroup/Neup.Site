
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getTemplate, saveTemplate, type Template } from '@/actions/editor/templates';
import { getSources, type Source } from '@/actions/editor/sources';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2, AlertCircle } from 'lucide-react';
import { z } from 'zod';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.enum(['section', 'page', 'element']),
  method: z.enum(['codebase', 'textual', 'dragger']),
  source: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const NO_SOURCE_VALUE = '--none--';

export default function EditBasicsPage({ params }: { params: { id: string } }) {
  const [template, setTemplate] = useState<Template | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
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
      method: 'codebase',
      source: '',
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [templateResult, sourcesResult] = await Promise.all([
        getTemplate(params.id),
        getSources(),
      ]);

      if (templateResult.success && templateResult.template) {
        setTemplate(templateResult.template);
        form.reset({
          name: templateResult.template.name,
          description: templateResult.template.description,
          type: templateResult.template.type,
          method: templateResult.template.method || 'codebase',
          source: templateResult.template.source || NO_SOURCE_VALUE,
        });
      } else {
        setError(templateResult.error || 'Failed to load template.');
      }

      if (sourcesResult.success && sourcesResult.sources) {
        setSources(sourcesResult.sources);
      }
      setLoading(false);
    };

    fetchData();
  }, [params.id, form]);

  const onSubmit = async (data: FormValues) => {
    const result = await saveTemplate({
      ...data,
      source: data.source === NO_SOURCE_VALUE ? '' : data.source,
    }, params.id);
    
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
            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Method</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a creation method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="codebase">Codebase (HTML, JSON)</SelectItem>
                        <SelectItem value="textual">Textual (AI)</SelectItem>
                        <SelectItem value="dragger" disabled>Dragger (Coming Soon)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data Source (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a data source" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                       <SelectItem value={NO_SOURCE_VALUE}>None</SelectItem>
                       {sources.map(s => (
                           <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                       ))}
                    </SelectContent>
                  </Select>
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
