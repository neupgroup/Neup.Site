
'use client';

import { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getSection, saveSection, type Section } from '@/services/editor/sections';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
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

export default function EditSectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [section, setSection] = useState<Section | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: '',
      content: '[]',
    },
  });

  useEffect(() => {
    const fetchSection = async () => {
      if (!id) return;
      setLoading(true);
      const sectionResult = await getSection(id);

      if (sectionResult.success && sectionResult.section) {
        setSection(sectionResult.section);
        form.reset({
          name: sectionResult.section.name,
          type: sectionResult.section.type,
          content: sectionResult.section.content,
        });
      } else {
        setError(sectionResult.error || 'Failed to load section.');
      }
      setLoading(false);
    };

    fetchSection();
  }, [id, form]);

  const onSubmit = async (data: FormValues) => {
    if (!section) return;
    const result = await saveSection({
      ...data,
      createdBy: section.createdBy,
      source: section.source,
    }, id);
    
    if (result.success) {
      toast({ title: 'Section Updated', description: 'The section has been saved.' });
      router.push(`/site/sections/${id}`);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };

  if (loading) {
    return <Skeleton className="h-96 w-full max-w-2xl" />;
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Form {...form}>
      <div className="flex justify-start mb-4">
        <Button variant="ghost" asChild>
            <Link href={`/site/sections/${id}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Section
            </Link>
        </Button>
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-2xl">
        <Card>
            <CardHeader>
                <CardTitle>Edit Section</CardTitle>
                <CardDescription>Modify the details of your reusable section.</CardDescription>
            </CardHeader>
          <CardContent className="space-y-4 pt-6">
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
                        <Textarea placeholder="Enter the JSON structure..." {...field} rows={20} className="font-mono" />
                    </FormControl>
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
