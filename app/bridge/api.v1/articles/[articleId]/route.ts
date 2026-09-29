import { NextResponse } from 'next/server';
import { getArticleByReference } from '@/services/articles';
import { articleReference } from '@/services/news-reference';
import { logApiError, requireProject } from '../../members/_helpers';

export async function GET(_request: Request, context: { params: Promise<{ articleId: string }> }) {
  const validation = await requireProject(_request);
  if (validation instanceof Response) return validation;
  const reference = (await context.params).articleId;
  try {
    const result = await getArticleByReference(reference);
    if (!result.success || !result.article) {
      return NextResponse.json({ success: false, error: result.error || 'Article not found.' }, { status: 404 });
    }
    const article = result.article;
    return NextResponse.json({ success: true, data: {
      slug: articleReference(article), writtenAt: article.createdAt ?? article.publishedAt,
      writtenBy: article.author, title: article.title, coverImageUrl: article.imageUrl ?? null,
      metaDescription: article.metaDescription ?? null, language: article.language ?? null, tags: article.tags ?? [],
    } });
  } catch (error) {
    await logApiError('bridge.articles.get-one', error);
    return NextResponse.json({ success: false, error: 'Unable to load article right now.' }, { status: 500 });
  }
}
