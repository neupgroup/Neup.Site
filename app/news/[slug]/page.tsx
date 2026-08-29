
import { getNewsArticleById } from '@/services/news';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '#/components/ui/card';
import { Button } from '#/components/ui/buttons';
import { AlertCircle, ArrowLeft, Pencil, Settings } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '#/components/ui/alert';
import Link from 'next/link';
import Image from 'next/image';
import { generatePageMetadata } from '#/core/helpers/metadata';

export async function generateMetadata({ params }: { params: { slug: string }}) {
    const { article } = await getNewsArticleById(params.slug);
    return generatePageMetadata({
      title: article?.title || 'View Article',
    });
}

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { article, error } = await getNewsArticleById(slug);

  if (error || !article) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <Alert variant="destructive" className="max-w-2xl">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || 'Article not found.'}</AlertDescription>
          <div className="mt-4">
            <Button asChild variant="tertiary">
              <Link href="/news">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to News
              </Link>
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-4">
        <Button variant="plain" asChild>
          <Link href="/news">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to News
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          {article.imageUrl && (
            <div className="relative w-full h-64 mb-4 rounded-t-lg overflow-hidden">
                <Image src={article.imageUrl} alt={article.title} fill objectFit="cover" />
            </div>
          )}
          <CardTitle className="text-4xl font-headline">{article.title}</CardTitle>
          <CardDescription>
            By {article.author} on {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : 'N/A'}
          </CardDescription>
        </CardHeader>
        <CardContent className="prose prose-lg dark:prose-invert max-w-none">
          <div dangerouslySetInnerHTML={{ __html: article.content }} />
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
           <Button asChild variant="tertiary">
            <Link href={`/news/${article.id}/edit`}>
              <Settings className="mr-2 h-4 w-4" /> Settings
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/news/${article.id}/edit/content`}>
              <Pencil className="mr-2 h-4 w-4" /> Edit Content
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
