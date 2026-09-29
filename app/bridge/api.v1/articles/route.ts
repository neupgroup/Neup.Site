import { NextResponse } from 'next/server';
import { getArticles } from '@/services/articles';
import { articleReference } from '@/services/news-reference';

export async function GET() {
  const result = await getArticles();
  if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: 500 });

  return NextResponse.json({
    success: true,
    data: (result.articles ?? []).map((article) => ({
      reference: articleReference(article),
      writtenAt: article.createdAt ?? article.publishedAt,
      writtenBy: article.author,
      title: article.title,
      coverImageUrl: article.imageUrl ?? null,
      metaDescription: article.metaDescription ?? null,
      language: article.language ?? null,
      tags: article.tags ?? [],
    })),
  });
}
