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
