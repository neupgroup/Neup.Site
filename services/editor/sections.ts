
'use server';

import { getActiveProjectId } from '@/services/projects';
import { prisma as db } from '@/core/database/prisma';

export interface Section {
  id: string;
  assetId: string;
  name: string;
  description?: string;
  type: string;
  content: string;
  source: 'json';
  createdBy: 'user' | 'ai';
  createdAt: string | null;
}

export async function saveSection(section: Omit<Section, 'id' | 'createdAt' | 'assetId'>, id?: string): Promise<{ success: boolean; id?: string; error?: string }> {
  const assetId = await getActiveProjectId();
  if (!assetId) return { success: false, error: 'Asset ID not found.' };

  try {
    if (id) {
      const existing = await db.section.findFirst({ where: { id, assetId } });
      if (!existing) return { success: false, error: 'Unauthorized.' };
      await db.section.update({
        where: { id },
        data: { name: section.name, type: section.type, content: section.content, source: 'json', createdBy: section.createdBy },
      });
      return { success: true, id };
    } else {
      const record = await db.section.create({
        data: { assetId, name: section.name, type: section.type, content: section.content, source: 'json', createdBy: section.createdBy, createdAt: new Date() },
        select: { id: true },
      });
      return { success: true, id: record.id };
    }
  } catch (error: any) {
    return { success: false, error: 'Failed to save section. An error has been logged.' };
  }
}

export async function getSections(): Promise<{ success: boolean; sections?: Section[]; error?: string }> {
  const assetId = await getActiveProjectId();
  if (!assetId) return { success: false, error: 'Asset ID not found.' };

  try {
    const records = await db.section.findMany({ where: { assetId } });
    const sections: Section[] = records.map(r => ({
      id: r.id,
      assetId: r.assetId,
      name: r.name,
      type: r.type,
      content: r.content,
      source: 'json',
      createdBy: r.createdBy as Section['createdBy'],
      createdAt: r.createdAt ? r.createdAt.toISOString() : null,
    }));
    return { success: true, sections };
  } catch (error: any) {
    return { success: false, error: 'Failed to fetch sections. An error has been logged.' };
  }
}

export async function getSection(id: string): Promise<{ success: boolean; section?: Section; error?: string }> {
  const assetId = await getActiveProjectId();
  if (!assetId) return { success: false, error: 'Asset ID not found.' };

  try {
    const record = await db.section.findFirst({ where: { id, assetId } });
    if (!record) return { success: false, error: 'Section not found.' };

    const section: Section = {
      id: record.id,
      assetId: record.assetId,
      name: record.name,
      type: record.type,
      content: record.content,
      source: 'json',
      createdBy: record.createdBy as Section['createdBy'],
      createdAt: record.createdAt ? record.createdAt.toISOString() : null,
    };
    return { success: true, section };
  } catch (error: any) {
    return { success: false, error: 'Failed to fetch section. An error has been logged.' };
  }
}

export async function deleteSection(id: string): Promise<{ success: boolean; error?: string }> {
  const assetId = await getActiveProjectId();
  if (!assetId) return { success: false, error: 'Asset ID not found.' };

  try {
    const existing = await db.section.findFirst({ where: { id, assetId } });
    if (!existing) return { success: false, error: 'Unauthorized.' };
    await db.section.delete({ where: { id } });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: `Failed to delete section with ID ${id}. An error has been logged.` };
  }
}
