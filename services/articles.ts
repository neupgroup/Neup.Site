'use server';

import crypto from 'crypto';
import { prisma as db } from '@neup/core/database/prisma';
import { Prisma } from '@/prisma/client';
import { revalidatePath } from 'next/cache';
import { getActiveProjectId } from '@/services/projects';
import { logger } from '@neup/logica/logger';
import { parseArticleReference, slugifyArticle } from '@/services/news-reference';

export interface Article {
  id: string;
  projectId?: string | null;
  slug?: string;
  title: string;
  content: string;
  author: string;
  imageUrl?: string;
  metaDescription?: string;
  language?: string;
  tags?: string[];
  publishedAt: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

/** Normalize HTML and Unicode whitespace before article content is persisted. */
function normalizeArticleContent(content: string): string {
  return content
    .replace(/&(?:nbsp|NonBreakingSpace|ensp|emsp|thinsp|hairsp|verythinsp|mediumspace|ideographicspace);|&#(?:160|8194|8195|8201|8202|8203|x0*a0|x02002|x02003|x02009|x0200a|x0200b);/gi, ' ')
    .replace(/[\u00a0\u1680\u180e\u2000-\u200b\u202f\u205f\u3000\ufeff]/g, ' ');
}

function mapArticle(record: any): Article {
  return {
    id: record.id, projectId: record.projectId, slug: record.slug ?? undefined,
    title: record.title, content: record.content, author: record.author,
    imageUrl: record.imageUrl ?? undefined, metaDescription: record.metaDescription ?? undefined,
    language: record.language ?? undefined,
    tags: Array.isArray(record.tags) ? record.tags.filter((tag: unknown): tag is string => typeof tag === 'string') : undefined,
    publishedAt: record.publishedAt?.toISOString() ?? null,
    createdAt: record.createdAt?.toISOString() ?? null, updatedAt: record.updatedAt?.toISOString() ?? null,
  };
}

export async function createArticle(data: Partial<Omit<Article, 'id' | 'publishedAt' | 'createdAt' | 'updatedAt'>> & { title: string }) {
  try {
    const projectId = await getActiveProjectId();
    if (!projectId) return { success: false, error: 'Project context is required.' };
    const slug = slugifyArticle(data.title);
    const id = crypto.randomUUID();
    const now = new Date();
    await db.article.create({ data: {
      id, projectId, slug, title: data.title, author: data.author || 'Author Name',
      content: normalizeArticleContent(data.content || '<p>Start writing your article here...</p>'),
      imageUrl: data.imageUrl?.trim() || null, metaDescription: data.metaDescription?.trim() || null,
      language: data.language?.trim() || null, tags: data.tags?.length ? data.tags : Prisma.JsonNull,
      publishedAt: now, createdAt: now, updatedAt: now,
    }});
    revalidatePath('/articles');
    return { success: true, id };
  } catch (error: any) {
    await logger.error({ message: `Failed to create article: ${error.message}`, stack: error.stack, source: 'createArticle' });
    return { success: false, error: 'Failed to create article.' };
  }
}

export async function getArticles() {
  try {
    const projectId = await getActiveProjectId();
    if (!projectId) return { success: true, articles: [] as Article[] };
    const records = await db.article.findMany({ where: { projectId }, orderBy: [{ publishedAt: 'desc' }, { id: 'asc' }] });
    return { success: true, articles: records.map(mapArticle) };
  } catch { return { success: false, error: 'Failed to fetch articles.' }; }
}

export async function getArticleByReference(reference: string) {
  const parsed = parseArticleReference(reference);
  const projectId = await getActiveProjectId();
  if (!parsed || !projectId) return { success: false, error: 'Article not found.' };
  const record = await db.article.findFirst({ where: { id: parsed.id, slug: parsed.slug, projectId } });
  return record ? { success: true, article: mapArticle(record) } : { success: false, error: 'Article not found.' };
}

export async function updateArticle(id: string, data: Partial<Omit<Article, 'id'>>) {
  const projectId = await getActiveProjectId();
  if (!projectId) return { success: false, error: 'Project context is required.' };
  const result = await db.article.updateMany({ where: { id, projectId }, data: {
    ...(typeof data.title === 'string' ? { title: data.title } : {}), ...(typeof data.author === 'string' ? { author: data.author } : {}),
    ...(typeof data.content === 'string' ? { content: normalizeArticleContent(data.content) } : {}), ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl?.trim() || null } : {}),
    ...(data.metaDescription !== undefined ? { metaDescription: data.metaDescription?.trim() || null } : {}), ...(data.language !== undefined ? { language: data.language?.trim() || null } : {}),
    ...(data.tags !== undefined ? { tags: data.tags?.length ? data.tags : Prisma.JsonNull } : {}), updatedAt: new Date(),
  }});
  return result.count ? { success: true } : { success: false, error: 'Article not found.' };
}

export async function deleteArticle(id: string) {
  const projectId = await getActiveProjectId();
  if (!projectId) return { success: false, error: 'Project context is required.' };
  const result = await db.article.deleteMany({ where: { id, projectId } });
  return result.count ? { success: true } : { success: false, error: 'Article not found.' };
}
