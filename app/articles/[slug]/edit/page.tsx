'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { getNewsArticleByReference, updateNewsArticle, type NewsArticle } from '@/services/news';
import { articleReference } from '@/services/news-reference';
import { Button } from '@neup/components/ui/button';
import { Input } from '@neup/components/ui/input';
import { RichTextEditor } from '@/components/articles/RichTextEditor';
import { usePageTitle } from '@neup/core/hooks/use-page-title';

export default function EditArticlePage() {
  usePageTitle('Edit Article');
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { getNewsArticleByReference(params.slug).then((result) => setArticle(result.article ?? null)); }, [params.slug]);

  if (!article) return <div>Loading article…</div>;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const currentArticle = article;
    if (!currentArticle) return;
    setSaving(true);
    const result = await updateNewsArticle(currentArticle.id, currentArticle);
    if (result.success) {
      const project = searchParams.get('project');
      router.push(`/articles/${articleReference(currentArticle)}${project ? `?project=${encodeURIComponent(project)}` : ''}`);
    }
    else setSaving(false);
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-headline text-3xl font-semibold">Edit article</h1>
        <p className="mt-2 text-muted-foreground">Update your article content and details.</p>
      </div>
      <Input value={article.title} onChange={(event) => setArticle({ ...article, title: event.target.value })} />
      <Input value={article.author} onChange={(event) => setArticle({ ...article, author: event.target.value })} />
      <Input value={article.imageUrl || ''} onChange={(event) => setArticle({ ...article, imageUrl: event.target.value })} placeholder="Featured image URL" />
      <RichTextEditor value={article.content} onChange={(content) => setArticle({ ...article, content })} />
      <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
    </form>
  );
}
