
'use server';

import { Template } from '@/schemas/template';
import { prisma as db } from '@/core/database/prisma';
import { logErrorToDatabase } from '@/core/helpers/logger';

export async function saveTemplate(template: Omit<Template, 'id' | 'createdAt'>, id?: string): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const data = {
      name: template.name,
      description: template.description || '',
      imageUrl: template.imageUrl || null,
      previewUrl: template.previewUrl || null,
      category: template.category || null,
      type: template.type || 'section',
      status: template.status || 'draft',
      usableOn: template.usableOn || ['json'],
      content: template.content || {},
      createdBy: template.createdBy || 'user',
    };

    if (id) {
      await db.template.update({ where: { id }, data });
      return { success: true, id };
    } else {
      const record = await db.template.create({ data: { ...data, createdAt: new Date() }, select: { id: true } });
      return { success: true, id: record.id };
    }
  } catch (error: any) {
    await logErrorToDatabase({ message: `Failed to save template: ${error.message}`, stack: error.stack, source: 'saveTemplate' });
    return { success: false, error: 'Failed to save template. An error has been logged.' };
  }
}

export async function getTemplates(): Promise<{ success: boolean, templates?: Template[], error?: string }> {
  try {
    const records = await db.template.findMany();
    const templates: Template[] = records.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description || '',
      imageUrl: r.imageUrl ?? undefined,
      previewUrl: r.previewUrl ?? undefined,
      category: r.category ?? undefined,
      type: r.type || 'section',
      status: r.status || 'draft',
      usableOn: (r.usableOn as any) || ['json'],
      content: (r.content as any) || {},
      createdBy: r.createdBy,
      createdAt: r.createdAt ? r.createdAt.toISOString() : null,
    }));
    return { success: true, templates };
  } catch (error: any) {
    return { success: false, error: 'Failed to fetch templates. An error has been logged.' };
  }
}

export async function getTemplate(id: string): Promise<{ success: boolean, template?: Template, error?: string }> {
  try {
    const record = await db.template.findUnique({ where: { id } });
    if (!record) return { success: false, error: 'Template not found.' };

    const template: Template = {
      id: record.id,
      name: record.name,
      description: record.description || '',
      imageUrl: record.imageUrl ?? undefined,
      previewUrl: record.previewUrl ?? undefined,
      category: record.category ?? undefined,
      type: record.type || 'section',
      status: record.status || 'draft',
      usableOn: (record.usableOn as any) || ['json'],
      content: (record.content as any) || {},
      createdBy: record.createdBy || 'user',
      createdAt: record.createdAt ? record.createdAt.toISOString() : null,
    };
    return { success: true, template };
  } catch (error: any) {
    return { success: false, error: 'Failed to fetch template. An error has been logged.' };
  }
}

export async function deleteTemplate(id: string) {
  try {
    await db.template.delete({ where: { id } });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: `Failed to delete template with ID ${id}. An error has been logged.` };
  }
}
