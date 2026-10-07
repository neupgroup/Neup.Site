'use server';

import { getActiveProjectId } from '@/services/projects';
import { prisma as db } from '@neup/core/database/prisma';

export async function getBlockForEdit(id: string) {
  const projectId = await getActiveProjectId();
  if (!projectId) return null;
  return db.block.findFirst({ where: { id, projectId }, select: { id: true, name: true, slug: true, payload: true } });
}

export async function updateBlock(input: { id: string; name: string; payload: unknown }) {
  const projectId = await getActiveProjectId();
  if (!projectId) return { success: false as const, error: 'Active project not found.' };

  try {
    const existing = await db.block.findFirst({ where: { id: input.id, projectId }, select: { id: true } });
    if (!existing) return { success: false as const, error: 'Block not found.' };

    await db.block.update({
      where: { id: input.id },
      data: { name: input.name.trim(), payload: input.payload as any },
    });
    return { success: true as const };
  } catch {
    return { success: false as const, error: 'Failed to update block.' };
  }
}
