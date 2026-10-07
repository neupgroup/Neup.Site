'use server';

import { slugify } from '@neup/core/helpers/slug';
import { prisma as db } from '@neup/core/database/prisma';

export async function saveBlockTemplate(input: { name: string; type?: string }): Promise<
  | { success: true; id: string; slug: string }
  | { success: false; error: string }
> {
  const name = input.name.trim();
  if (!name) return { success: false, error: 'Template name is required.' };

  try {
    const slug = slugify(name, 'template').slice(0, 24) || 'template';
    const template = await db.blockTemplate.create({
      data: { name, slug, type: input.type || 'section' },
      select: { id: true, slug: true },
    });
    return { success: true, ...template };
  } catch {
    return { success: false, error: 'Failed to create block template.' };
  }
}

export async function updateBlockTemplateCover(input: { id: string; coverUrl: string }): Promise<{ success: true } | { success: false; error: string }> {
  const coverUrl = input.coverUrl.trim();
  if (coverUrl && !/^https?:\/\//i.test(coverUrl)) {
    return { success: false, error: 'Enter a valid image URL beginning with http:// or https://.' };
  }

  try {
    const current = await db.blockTemplate.findUnique({ where: { id: input.id }, select: { media: true } });
    if (!current) return { success: false, error: 'Template not found.' };
    const existing = current.media && typeof current.media === 'object' && !Array.isArray(current.media)
      ? current.media as Record<string, unknown>
      : {};
    const media = { ...existing, cover: coverUrl || null };
    await db.blockTemplate.update({ where: { id: input.id }, data: { media } });
    return { success: true };
  } catch {
    return { success: false, error: 'Could not update the cover image.' };
  }
}

export async function updateBlockTemplateContent(input: { id: string; code?: string; payload?: unknown; description?: string }): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await db.blockTemplate.update({
      where: { id: input.id },
      data: {
        ...(input.code !== undefined ? { code: input.code || null } : {}),
        ...(input.payload !== undefined ? { payload: input.payload as object } : {}),
        ...(input.description !== undefined ? { description: input.description || null } : {}),
      },
    });
    return { success: true };
  } catch {
    return { success: false, error: 'Could not update the template content.' };
  }
}
