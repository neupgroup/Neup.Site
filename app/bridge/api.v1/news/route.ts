/**
 * News collection API.
 *
 * Request:
 *   curl https://example.com/bridge/api.v1/news \
 *     -H 'x-project: PROJECT_ID'
 *
 * Response:
 *   { "success": true, "data": [{ "slug": "site-news--NEWS_UUID", "writtenAt": "2026-09-30T08:30:00.000Z", "writtenBy": "Author Name", "title": "Site News", "coverImageUrl": null, "metaDescription": null, "language": null, "tags": [] }] }
 */
import { NextResponse } from 'next/server';
import { getNewsArticles } from '@/services/news';
import { articleReference } from '@/services/news-reference';

export async function GET() {
  const result = await getNewsArticles();
  if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  return NextResponse.json({ success: true, data: (result.articles ?? []).map((article) => ({
    reference: articleReference(article), writtenAt: article.createdAt ?? article.publishedAt,
    writtenBy: article.author, title: article.title, coverImageUrl: article.imageUrl ?? null,
    metaDescription: null, language: null, tags: [],
  })) });
}
