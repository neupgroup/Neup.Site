import { notFound } from 'next/navigation';
import { getArticleByReference } from '@/services/articles';
import { articleReference, formatArticlePublishedTime } from '@/services/news-reference';
import { LinkButton } from '@neup/components/ui/link-button';
import { DeleteArticleButton } from '@/components/articles/DeleteArticleButton';

export default async function ArticlePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ project?: string }> }) {
  const reference = (await params).slug;
  const { project } = await searchParams;
  const projectQuery = project ? `?project=${encodeURIComponent(project)}` : '';
  const result = await getArticleByReference(reference);
  if (!result.article) notFound();
  const article = result.article;

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      {article.imageUrl ? <img src={article.imageUrl} alt="" className="max-h-[420px] w-full rounded-lg object-cover" /> : null}
      <div className="space-y-2">
        <h1 className="font-headline text-4xl font-semibold">{article.title}</h1>
        <p className="text-sm text-muted-foreground">By {article.author} <span aria-hidden="true">|</span> {formatArticlePublishedTime(article.publishedAt)}</p>
      </div>
      <div
        className="max-w-none [&_p]:mb-4 [&_p]:leading-7 [&_h1]:mb-5 [&_h1]:mt-8 [&_h1]:font-headline [&_h1]:text-4xl [&_h1]:font-bold [&_h2]:mb-4 [&_h2]:mt-7 [&_h2]:font-headline [&_h2]:text-3xl [&_h2]:font-semibold [&_h3]:mb-3 [&_h3]:mt-6 [&_h3]:font-headline [&_h3]:text-2xl [&_h3]:font-semibold"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />
      <div className="pt-4">
        <div className="flex flex-wrap gap-3">
          <LinkButton href={`/articles/${articleReference(article)}/edit${projectQuery}`} variant="outlined">
            Edit article
          </LinkButton>
          <DeleteArticleButton articleId={article.id} />
        </div>
      </div>
    </article>
  );
}
