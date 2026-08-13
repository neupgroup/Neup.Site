
'use server';

import { prisma as db } from '@/core/database/prisma';
import { revalidatePath } from 'next/cache';
import { logger } from '@/logica/logger';

export interface NewsArticle {
    id: string;
    title: string;
    content: string;
    author: string;
    imageUrl?: string;
    publishedAt: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
}

function slugify(text: string) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

export async function createNewsArticle(data: Partial<Omit<NewsArticle, 'id' | 'publishedAt' | 'createdAt' | 'updatedAt'>> & { title: string }): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const slug = slugify(data.title);
    const randomId = Math.random().toString(36).substring(2, 8);
    const id = `${slug}-${randomId}`;
    const now = new Date();

    await db.newsArticle.create({
      data: {
        id,
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

    revalidatePath('/news');
    revalidatePath(`/news/${id}`);
    return { success: true, id: id };
  } catch (e: any) {
    await logger.error({ message: `Failed to create news article: ${e.message}`, stack: e.stack, source: 'createNewsArticle' });
    return { success: false, error: 'Failed to create news article.' };
  }
}

export async function getNewsArticles(): Promise<{ success: boolean; articles?: NewsArticle[]; error?: string }> {
    try {
        const records = await db.newsArticle.findMany({
          orderBy: [{ publishedAt: 'desc' }, { id: 'asc' }],
        });
        const articles = records.map((record) => ({
          id: record.id,
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
        const record = await db.newsArticle.findUnique({ where: { id } });
        if (!record) {
            return { success: false, error: 'News article not found.' };
        }
        
        const article: NewsArticle = {
            id: record.id,
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

export async function updateNewsArticle(id: string, data: Partial<Omit<NewsArticle, 'id'>>): Promise<{ success: boolean; error?: string }> {
  try {
    await db.newsArticle.update({
      where: { id },
      data: {
        ...(typeof data.title === 'string' ? { title: data.title } : {}),
        ...(typeof data.slug === 'string' ? { slug: data.slug } : {}),
        ...(typeof data.author === 'string' ? { author: data.author } : {}),
        ...(typeof data.content === 'string' ? { content: data.content } : {}),
        ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl?.trim() ? data.imageUrl.trim() : null } : {}),
        updatedAt: new Date(),
      },
    });
    revalidatePath('/news');
    revalidatePath(`/news/${id}`);
    
    return { success: true };
  } catch (e: any) {
    await logger.error({ message: `Failed to update news article ${id}: ${e.message}`, stack: e.stack, source: 'updateNewsArticle' });
    return { success: false, error: 'Failed to update news article.' };
  }
}

export async function deleteNewsArticle(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await db.newsArticle.delete({ where: { id } });
        revalidatePath('/news');
        return { success: true };
    } catch (e: any) {
        await logger.error({ message: `Failed to delete news article ${id}: ${e.message}`, stack: e.stack, source: 'deleteNewsArticle' });
        return { success: false, error: 'Failed to delete news article.' };
    }
}
