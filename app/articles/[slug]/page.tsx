import { notFound } from 'next/navigation';
import { getNewsArticleByReference } from '@/services/news';
import { articleReference } from '@/services/news-reference';
import { LinkButton } from '@neup/components/ui/link-button';
import { DeleteArticleButton } from '@/components/articles/DeleteArticleButton';

export default async function ArticlePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ project?: string }> }) {
  const reference = (await params).slug;
  const { project } = await searchParams;
  const projectQuery = project ? `?project=${encodeURIComponent(project)}` : '';
  const result = await getNewsArticleByReference(reference);
  if (!result.article) notFound();
  const article = result.article;

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      {article.imageUrl ? <img src={article.imageUrl} alt="" className="max-h-[420px] w-full rounded-lg object-cover" /> : null}
      <div className="space-y-2"><h1 className="font-headline text-4xl font-semibold">{article.title}</h1><p className="text-sm text-muted-foreground">By {article.author}</p></div>
      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: article.content }} />
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
