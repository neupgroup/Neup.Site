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
} from '#/components/ui/card';
import { Button } from '#/components/ui/button';
import { LinkButton } from "#/components/ui/link-button";
import { Input } from '#/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '#/components/ui/form';
import { Save, ArrowLeft, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import { useToast } from '#/core/hooks/useToast';
import { getNewsArticleById, updateNewsArticle, deleteNewsArticle, type NewsArticle } from '@/services/news';
import Link from 'next/link';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Skeleton } from '#/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '#/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '#/components/ui/alert-dialog';


const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  imageUrl: z.string().url().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditNewsSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      author: '',
      imageUrl: '',
    },
  });

  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      const result = await getNewsArticleById(slug);
      if (result.success && result.article) {
        setArticle(result.article);
        form.reset({
          title: result.article.title,
          author: result.article.author,
          imageUrl: result.article.imageUrl,
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
      toast({ title: 'Article Settings Updated!', description: `Successfully updated ${data.title}.` });
      router.push(`/news/${article.id}`);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
      if (!article) return;
      setShowDeleteConfirm(false);
      const result = await deleteNewsArticle(article.id);
      if (result.success) {
        toast({ title: "Article Deleted", description: "The article has been removed."});
        router.push('/news');
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
      }
  }

  if (loading) {
    return (
      <div className="w-full space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
          <CardFooter><Skeleton className="h-10 w-28" /></CardFooter>
        </Card>
      </div>
    );
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <LinkButton variant="plain" size="icon" href={`/news/${slug}>
                <ArrowLeft />
              </LinkButton>
            <h1 className="font-headline text-2xl font-semibold tracking-tight">Article Settings</h1>
          </div>
          <Button htmlType="button" variant="solid" convey="danger" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete Article
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Article Details</CardTitle>
            <CardDescription>Update the metadata for your article.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="author" render={({ field }) => (
              <FormItem><FormLabel>Author</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="imageUrl" render={({ field }) => (
              <FormItem><FormLabel>Image URL (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </CardContent>
          <CardFooter>
            <Button variant="solid" htmlType="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </CardFooter>
        </Card>
      </form>
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This will permanently delete the article "{article?.title}". This action cannot be undone.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Form>
  );
}
    
