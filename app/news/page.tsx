import { Link } from '@neup/components/ui/link';
import { getNewsArticles } from '@/services/news';
import { LinkButton } from '@neup/components/ui/link-button';
import { ArrowRight, Newspaper, Plus } from 'lucide-react';
import { formatArticlePublishedTime } from '@/services/news-reference';
import { generatePageMetadata } from '@neup/core/helpers/metadata';

export async function generateMetadata() {
  return generatePageMetadata({ title: 'News Articles' });
}

export default async function NewsListPage({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const { project } = await searchParams;
  const projectQuery = project ? `?project=${encodeURIComponent(project)}` : '';
  const result = await getNewsArticles();
  const articles = result.articles ?? [];

  return (
    <div className="w-full space-y-8">
      <header className="space-y-2">
        <h1 className="font-headline text-2xl font-semibold tracking-tight">News</h1>
        <p className="text-muted-foreground">Read and manage news published on your site.</p>
      </header>
      {result.error ? <p className="text-destructive">{result.error}</p> : (
        <div className="grid gap-4">
          <LinkButton variant="plain" className="grid h-auto justify-start gap-4 rounded-lg border-2 border-dashed border-muted-foreground/40 bg-card px-5 py-4 text-left transition-colors hover:border-primary hover:bg-primary/5 md:grid-cols-[auto_1fr_auto] md:items-center" href={`/news/create${projectQuery}`}>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted"><Plus className="h-5 w-5 text-muted-foreground" /></span>
            <span><span className="block font-medium">Write a new news item</span><span className="block text-sm text-muted-foreground">Publish news on this site.</span></span>
            <ArrowRight className="h-4 w-4" />
          </LinkButton>
          {articles.map((article) => (
            <Link key={article.id} href={`/news/${article.id}${projectQuery}`} className="block">
              <div className="rounded-lg border bg-card px-5 py-4 text-left transition-colors hover:border-primary hover:bg-primary/5">
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted"><Newspaper className="h-5 w-5 text-muted-foreground" /></span>
                  <span className="min-w-0 flex-1"><span className="block font-medium">{article.title}</span><span className="block text-sm text-muted-foreground">{article.author} <span aria-hidden="true">|</span> {formatArticlePublishedTime(article.publishedAt)}</span></span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </Link>
          ))}
          {!articles.length ? <div className="rounded-lg border-2 border-dashed p-12 text-center text-muted-foreground">No news yet.</div> : null}
        </div>
      )}
    </div>
  );
}
