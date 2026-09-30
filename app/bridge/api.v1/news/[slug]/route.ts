/**
 * News detail API.
 *
 * Request:
 *   curl https://example.com/bridge/api.v1/news/site-news--NEWS_UUID \
 *     -H 'x-project: PROJECT_ID'
 *
 * Response:
 *   { "success": true, "data": { "slug": "site-news--NEWS_UUID", "writtenAt": "2026-09-30T08:30:00.000Z", "writtenBy": "Author Name", "title": "Site News", "coverImageUrl": null, "metaDescription": null, "language": null, "tags": [] } }
 */
import { NextResponse } from 'next/server';
import { getNewsArticleByReference } from '@/services/news';
import { articleReference } from '@/services/news-reference';

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const result = await getNewsArticleByReference((await context.params).slug);
  if (!result.success || !result.article) return NextResponse.json({ success: false, error: result.error || 'News article not found.' }, { status: 404 });
  const article = result.article;
  return NextResponse.json({ success: true, data: {
    reference: articleReference(article), writtenAt: article.createdAt ?? article.publishedAt,
    writtenBy: article.author, title: article.title, coverImageUrl: article.imageUrl ?? null,
    metaDescription: null, language: null, tags: [],
  } });
}
