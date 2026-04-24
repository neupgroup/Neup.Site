
'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Save, ArrowLeft, Loader2, AlertCircle, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getNewsArticleById, updateNewsArticle, type NewsArticle } from '@/actions/news';
import Link from 'next/link';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { usePageTitle } from '@/hooks/use-page-title';

const formSchema = z.object({
  content: z.string().min(1, 'Content is required'),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditNewsContentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  usePageTitle('Edit Article Content');
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: '',
    },
  });

  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      const result = await getNewsArticleById(slug);
      if (result.success && result.article) {
        setArticle(result.article);
        form.reset({
          content: result.article.content,
        });
      } else {
        setError(result.error || 'Failed to fetch article details.');
      }
      setLoading(false);
    };

    fetchArticle();
  }, [slug, form]);

  const onSubmit = async (data: FormValues) => {
    if (!article) return;
    setIsSaving(true);
    const result = await updateNewsArticle(article.id, data);

    if (result.success) {
      toast({ title: 'Article Content Saved!', description: 'Your changes have been saved.' });
      router.push(`/news/${article.id}`);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-48 w-full" />
          </CardContent>
          <CardFooter><Skeleton className="h-10 w-28" /></CardFooter>
        </Card>
      </div>
    );
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
    <div className="w-full">
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                <Link href={`/news/${slug}`}>
                    <ArrowLeft />
                </Link>
                </Button>
                <div>
                    <h1 className="font-headline text-2xl font-semibold tracking-tight">Edit Content</h1>
                    <p className="text-muted-foreground">{article?.title}</p>
                </div>
            </div>
            <Button type="button" variant="outline" asChild>
                <Link href={`/news/${slug}/edit`}>
                    <Settings className="mr-2 h-4 w-4" /> Article Settings
                </Link>
            </Button>
            </div>
            <Card>
            <CardHeader>
                <CardTitle>Article Body</CardTitle>
                <CardDescription>Write and format the main content of your article here.</CardDescription>
            </CardHeader>
            <CardContent>
                <FormField control={form.control} name="content" render={({ field }) => (
                <FormItem>
                    <FormControl>
                    <RichTextEditor {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )} />
            </CardContent>
            <CardFooter>
                <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSaving ? 'Saving...' : 'Save Content'}
                </Button>
            </CardFooter>
            </Card>
        </form>
        </Form>
    </div>
  );
}
