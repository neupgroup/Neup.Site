
'use server';

import { prisma as db } from '@neup/core/database/prisma';
import { revalidatePath } from 'next/cache';
import { logger } from '@neup/logica/logger';
import crypto from 'crypto';
import { parseArticleReference, slugifyArticle } from '@/services/news-reference';
import { getActiveProjectId } from '@/services/projects';

export interface NewsArticle {
    id: string;
    projectId?: string | null;
    slug?: string;
    title: string;
    content: string;
    author: string;
    imageUrl?: string;
    publishedAt: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
}

export async function createNewsArticle(data: Partial<Omit<NewsArticle, 'id' | 'publishedAt' | 'createdAt' | 'updatedAt'>> & { title: string }): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const projectId = await getActiveProjectId();
    if (!projectId) return { success: false, error: 'Project context is required.' };
    const slug = slugifyArticle(data.title);
    const id = crypto.randomUUID();
    const now = new Date();

    await db.newsArticle.create({
      data: {
        id,
        projectId,
        slug,
        title: data.title,
        author: data.author || 'Author Name',
        content: data.content || '<p>Start writing your article here...</p>',
        imageUrl: data.imageUrl?.trim() ? data.imageUrl.trim() : null,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      },
    });

    revalidatePath('@neup/news');
    revalidatePath(`/news/${id}`);
    revalidatePath(`/articles/${slug}--${id}`);
    return { success: true, id: id };
  } catch (e: any) {
    await logger.error({ message: `Failed to create news article: ${e.message}`, stack: e.stack, source: 'createNewsArticle' });
    return { success: false, error: 'Failed to create news article.' };
  }
}

export async function getNewsArticles(): Promise<{ success: boolean; articles?: NewsArticle[]; error?: string }> {
    try {
        const records = await db.newsArticle.findMany({
          where: { projectId: await getActiveProjectId() },
          orderBy: [{ publishedAt: 'desc' }, { id: 'asc' }],
        });
        const articles = records.map((record) => ({
          id: record.id,
          projectId: record.projectId,
          slug: record.slug ?? undefined,
          title: record.title,
          content: record.content,
          author: record.author,
          imageUrl: record.imageUrl ?? undefined,
          publishedAt: record.publishedAt ? record.publishedAt.toISOString() : null,
          createdAt: record.createdAt ? record.createdAt.toISOString() : null,
          updatedAt: record.updatedAt ? record.updatedAt.toISOString() : null,
        })) as NewsArticle[];
        return { success: true, articles };
    } catch (e: any) {
        await logger.error({ message: `Failed to get news articles: ${e.message}`, stack: e.stack, source: 'getNewsArticles' });
        return { success: false, error: 'Failed to fetch news articles.' };
    }
}

export async function getNewsArticleById(id: string): Promise<{ success: boolean; article?: NewsArticle; error?: string }> {
    try {
        const record = await db.newsArticle.findFirst({ where: { id, projectId: await getActiveProjectId() } });
        if (!record) {
            return { success: false, error: 'News article not found.' };
        }
        
        const article: NewsArticle = {
            id: record.id,
            projectId: record.projectId,
            slug: record.slug ?? undefined,
            title: record.title,
            content: record.content,
            author: record.author,
            imageUrl: record.imageUrl ?? undefined,
            publishedAt: record.publishedAt ? record.publishedAt.toISOString() : null,
            createdAt: record.createdAt ? record.createdAt.toISOString() : null,
            updatedAt: record.updatedAt ? record.updatedAt.toISOString() : null,
        };
        return { success: true, article };

    } catch (e: any) {
        await logger.error({ message: `Failed to get news article ${id}: ${e.message}`, stack: e.stack, source: 'getNewsArticleById' });
        return { success: false, error: 'Failed to fetch news article.' };
    }
}

export async function getNewsArticleByReference(reference: string): Promise<{ success: boolean; article?: NewsArticle; error?: string }> {
  const parsed = parseArticleReference(reference);
  if (!parsed) return { success: false, error: 'Invalid article reference.' };

  const result = await getNewsArticleById(parsed.id);
  if (!result.success || !result.article) return result;
  if (result.article.slug && result.article.slug !== parsed.slug) {
    return { success: false, error: 'Article reference does not match.' };
  }
  return result;
}

export async function updateNewsArticle(id: string, data: Partial<Omit<NewsArticle, 'id'>>): Promise<{ success: boolean; error?: string }> {
  try {
    const projectId = await getActiveProjectId();
    const result = await db.newsArticle.updateMany({
      where: { id, projectId },
      data: {
        ...(typeof data.title === 'string' ? { title: data.title } : {}),
        ...(typeof data.slug === 'string' ? { slug: data.slug } : {}),
        ...(typeof data.author === 'string' ? { author: data.author } : {}),
        ...(typeof data.content === 'string' ? { content: data.content } : {}),
        ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl?.trim() ? data.imageUrl.trim() : null } : {}),
        updatedAt: new Date(),
      },
    });
    if (!result.count) return { success: false, error: 'News article not found.' };
    revalidatePath('@neup/news');
    revalidatePath(`/news/${id}`);
    
    return { success: true };
  } catch (e: any) {
    await logger.error({ message: `Failed to update news article ${id}: ${e.message}`, stack: e.stack, source: 'updateNewsArticle' });
    return { success: false, error: 'Failed to update news article.' };
  }
}

export async function deleteNewsArticle(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const projectId = await getActiveProjectId();
        const result = await db.newsArticle.deleteMany({ where: { id, projectId } });
        if (!result.count) return { success: false, error: 'News article not found.' };
        revalidatePath('@neup/news');
        return { success: true };
    } catch (e: any) {
        await logger.error({ message: `Failed to delete news article ${id}: ${e.message}`, stack: e.stack, source: 'deleteNewsArticle' });
        return { success: false, error: 'Failed to delete news article.' };
    }
}
