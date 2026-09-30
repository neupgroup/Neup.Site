/**
 * Articles collection API.
 *
 * Request:
 *   curl https://example.com/bridge/api.v1/articles \
 *     -H 'x-project: PROJECT_ID'
 *
 * Response:
 *   {
 *     "success": true,
 *     "data": [{
 *       "slug": "my-article--ARTICLE_UUID",
 *       "writtenAt": "2026-09-30T08:30:00.000Z",
 *       "writtenBy": "Author Name",
 *       "title": "My Article",
 *       "coverImageUrl": null,
 *       "metaDescription": "Article summary.",
 *       "language": "en",
 *       "tags": ["guide", "updates"]
 *     }]
 *   }
 */
import { NextResponse } from 'next/server';
import { getArticles } from '@/services/articles';
import { articleReference } from '@/services/news-reference';
import { logApiError, requireProject } from '../members/_helpers';

function publicArticle(article: any) {
  return {
    slug: articleReference(article),
    writtenAt: article.createdAt ?? article.publishedAt,
    writtenBy: article.author,
    title: article.title,
    coverImageUrl: article.imageUrl ?? null,
    metaDescription: article.metaDescription ?? null,
    language: article.language ?? null,
    tags: article.tags ?? [],
  };
}

export async function GET(request: Request) {
  const validation = await requireProject(request);
  if (validation instanceof Response) return validation;
  try {
    const result = await getArticles();
    return NextResponse.json({ success: result.success, data: result.articles?.map(publicArticle), error: result.error }, { status: result.success ? 200 : 500 });
  } catch (error) {
    await logApiError('bridge.articles.get', error);
    return NextResponse.json({ success: false, error: 'Unable to load articles right now.' }, { status: 500 });
  }
}
