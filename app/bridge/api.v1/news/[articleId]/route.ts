import { NextResponse } from 'next/server';
import { getNewsArticleByReference } from '@/services/news';
import { articleReference } from '@/services/news-reference';

export async function GET(_request: Request, context: { params: Promise<{ articleId: string }> }) {
  const result = await getNewsArticleByReference((await context.params).articleId);
  if (!result.success || !result.article) return NextResponse.json({ success: false, error: result.error || 'News article not found.' }, { status: 404 });
  const article = result.article;
  return NextResponse.json({ success: true, data: {
    reference: articleReference(article), writtenAt: article.createdAt ?? article.publishedAt,
    writtenBy: article.author, title: article.title, coverImageUrl: article.imageUrl ?? null,
    metaDescription: null, language: null, tags: [],
  } });
}
