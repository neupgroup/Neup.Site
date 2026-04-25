
'use server';

import { db } from '@/core/lib/db';
import { revalidatePath } from 'next/cache';
import type { Team } from '@/schemas/team';
import { logErrorToDatabase } from '@/core/lib/logging';

export async function createTeam(data: Omit<Team, 'id'>): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const record = await db.team.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        order: data.order ?? null,
      },
      select: { id: true },
    });
    revalidatePath('/manage/team');
    return { success: true, id: record.id };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to create team: ${e.message}`, stack: e.stack, source: 'createTeam' });
    return { success: false, error: 'Failed to create team.' };
  }
}

export async function getTeams(): Promise<{ success: boolean; teams?: Team[]; error?: string }> {
  try {
    const records = await db.team.findMany({
      orderBy: [{ order: 'asc' }, { id: 'asc' }],
      select: { id: true, name: true, description: true, order: true },
    });

    const teams = records.map((record) => ({
      id: record.id,
      name: record.name,
      description: record.description ?? undefined,
      order: record.order ?? undefined,
    })) as Team[];
    return { success: true, teams };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to get teams: ${e.message}`, stack: e.stack, source: 'getTeams' });
    return { success: false, error: 'Failed to fetch teams.' };
  }
}

export async function getTeam(id: string): Promise<{ success: boolean; team?: Team; error?: string }> {
    try {
        const record = await db.team.findUnique({
          where: { id },
          select: { id: true, name: true, description: true, order: true },
        });
        if (!record) {
            return { success: false, error: 'Team not found.' };
        }

        const team: Team = {
            id: record.id,
            name: record.name,
            description: record.description ?? undefined,
            order: record.order ?? undefined,
        };
        return { success: true, team };
    } catch (e: any) {
        await logErrorToDatabase({ message: `Failed to get team ${id}: ${e.message}`, stack: e.stack, source: 'getTeam' });
        return { success: false, error: 'Failed to fetch team.' };
    }
}

export async function updateTeam(id: string, data: Partial<Omit<Team, 'id'>>): Promise<{ success: boolean; error?: string }> {
  try {
    await db.team.update({
      where: { id },
      data: {
        ...(typeof data.name === 'string' ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description ?? null } : {}),
        ...(data.order !== undefined ? { order: data.order ?? null } : {}),
      },
    });
    revalidatePath('/manage/team');
    revalidatePath(`/manage/team/${id}`);
    return { success: true };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to update team ${id}: ${e.message}`, stack: e.stack, source: 'updateTeam' });
    return { success: false, error: 'Failed to update team.' };
  }
}

export async function deleteTeam(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await db.team.delete({ where: { id } });
    revalidatePath('/manage/team');
    return { success: true };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to delete team ${id}: ${e.message}`, stack: e.stack, source: 'deleteTeam' });
    return { success: false, error: 'Failed to delete team.' };
  }
}
