
'use client';
import { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Save, ArrowLeft, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getNewsArticleBySlug, updateNewsArticle, deleteNewsArticle, type NewsArticle } from '@/actions/news';
import Link from 'next/link';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { RichTextEditor } from '@/components/ui/rich-text-editor';


const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  slug: z.string().optional(),
  imageUrl: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditNewsArticlePage({ params }: { params: { slug: string } }) {
  const { slug } = params;
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
      slug: '',
      imageUrl: '',
      content: '',
    },
  });

  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      const result = await getNewsArticleBySlug(slug);
      if (result.success && result.article) {
        setArticle(result.article);
        form.reset({
          title: result.article.title,
          author: result.article.author,
          slug: result.article.slug,
          imageUrl: result.article.imageUrl,
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
      toast({ title: 'Article Updated!', description: `Successfully updated ${data.title}.` });
      router.push(`/news/${data.slug || slug}`);
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
            <Skeleton className="h-48 w-full" />
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/news/${slug}`}>
                <ArrowLeft />
              </Link>
            </Button>
            <h1 className="font-headline text-2xl font-semibold tracking-tight">Edit Article</h1>
          </div>
          <Button type="button" variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Article Details</CardTitle>
            <CardDescription>Update the information for your article.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="author" render={({ field }) => (
              <FormItem><FormLabel>Author</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="slug" render={({ field }) => (
              <FormItem><FormLabel>Slug</FormLabel><FormControl><Input {...field} /></FormControl><FormDescription>Changing this will change the URL of the article.</FormDescription><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="imageUrl" render={({ field }) => (
              <FormItem><FormLabel>Image URL (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="content" render={({ field }) => (
              <FormItem>
                <FormLabel>Content</FormLabel>
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
              {isSaving ? 'Saving...' : 'Save Changes'}
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
