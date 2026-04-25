
'use client';
import { useState } from 'react';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createNewsArticle } from '@/services/news';
import Link from 'next/link';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePageTitle } from '@/hooks/use-page-title';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateNewsArticlePage() {
  usePageTitle('Create Article');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSaving(true);
    const result = await createNewsArticle(data);
    if (result.success && result.id) {
      toast({ title: 'Article Created!', description: 'Now you can write the content.' });
      router.push(`/news/${result.id}/edit/content`);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full">
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
                <Link href="/news">
                <ArrowLeft />
                </Link>
            </Button>
            <h1 className="font-headline text-2xl font-semibold tracking-tight">Create New Article</h1>
            </div>
            <Card>
            <CardHeader>
                <CardTitle>Article Title</CardTitle>
                <CardDescription>Give your new article a title to begin.</CardDescription>
            </CardHeader>
            <CardContent>
                <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
            </CardContent>
            <CardFooter>
                <Button type="submit" disabled={isSaving} className="w-full">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSaving ? 'Saving...' : 'Save and Continue'}
                </Button>
            </CardFooter>
            </Card>
        </form>
        </Form>
    </div>
  );
}
