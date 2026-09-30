import { getNewsArticleById } from '@/services/news';
import { LinkButton } from '@neup/components/ui/link-button';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@neup/components/ui/alert';
import { generatePageMetadata } from '@neup/core/helpers/metadata';
import { formatArticlePublishedTime } from '@/services/news-reference';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const { article } = await getNewsArticleById(params.slug);
  return generatePageMetadata({ title: article?.title || 'View News' });
}

export default async function NewsDetailPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ project?: string }> }) {
  const { slug } = await params;
  const { project } = await searchParams;
  const projectQuery = project ? `?project=${encodeURIComponent(project)}` : '';
  const { article, error } = await getNewsArticleById(slug);

  if (error || !article) return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error || 'News not found.'}</AlertDescription><div className="mt-4"><LinkButton variant="outlined" href={`/news${projectQuery}`}><ArrowLeft className="mr-2 h-4 w-4" />Back to News</LinkButton></div></Alert>;

  return (
    <div className="w-full space-y-6">
      <LinkButton variant="plain" href={`/news${projectQuery}`}><ArrowLeft className="mr-2 h-4 w-4" />Back to News</LinkButton>
      {article.imageUrl ? <img src={article.imageUrl} alt={article.title} className="max-h-[420px] w-full rounded-lg object-cover" /> : null}
      <div className="space-y-2"><h1 className="font-headline text-4xl font-semibold">{article.title}</h1><p className="text-sm text-muted-foreground">By {article.author} <span aria-hidden="true">|</span> {formatArticlePublishedTime(article.publishedAt)}</p></div>
      <div className="max-w-none [&_p]:mb-4 [&_p]:leading-7 [&_h1]:mb-5 [&_h1]:mt-8 [&_h1]:font-headline [&_h1]:text-4xl [&_h1]:font-bold [&_h2]:mb-4 [&_h2]:mt-7 [&_h2]:font-headline [&_h2]:text-3xl [&_h2]:font-semibold [&_h3]:mb-3 [&_h3]:mt-6 [&_h3]:font-headline [&_h3]:text-2xl [&_h3]:font-semibold" dangerouslySetInnerHTML={{ __html: article.content }} />
      <div className="pt-4"><div className="flex flex-wrap gap-3"><LinkButton variant="outlined" href={`/news/${article.id}/edit/content${projectQuery}`}>Edit content</LinkButton><LinkButton variant="outlined" href={`/news/${article.id}/settings${projectQuery}`}>Settings</LinkButton></div></div>
    </div>
  );
}
