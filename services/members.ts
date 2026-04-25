
'use server';

import { db } from '@/core/lib/db';
import { revalidatePath } from 'next/cache';
import type { Member } from '@/schemas/member';
import { logErrorToDatabase } from '@/core/lib/logging';

export async function createMember(data: Omit<Member, 'id'>): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const record = await db.member.create({
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        imageUrl: data.imageUrl ?? null,
        permissions: data.permissions ? (data.permissions as any) : undefined,
        teams: {
          connect: (data.teamIds ?? []).filter(Boolean).map((id) => ({ id })),
        },
      },
      select: { id: true },
    });
    revalidatePath('/manage/members');
    return { success: true, id: record.id };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to create member: ${e.message}`, stack: e.stack, source: 'createMember' });
    return { success: false, error: 'Failed to create member.' };
  }
}

export async function getMembers(): Promise<{ success: boolean; members?: Member[]; error?: string }> {
  try {
    const records = await db.member.findMany({
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      include: { teams: { select: { id: true } } },
    });

    const members = records.map((record) => ({
      id: record.id,
      name: record.name,
      email: record.email,
      role: record.role,
      imageUrl: record.imageUrl ?? undefined,
      teamIds: record.teams.map((team) => team.id),
      permissions: (record.permissions as any) ?? undefined,
    })) as Member[];
    return { success: true, members };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to get members: ${e.message}`, stack: e.stack, source: 'getMembers' });
    return { success: false, error: 'Failed to fetch members.' };
  }
}

export async function getMember(id: string): Promise<{ success: boolean; member?: Member; error?: string }> {
  try {
    const record = await db.member.findUnique({
      where: { id },
      include: { teams: { select: { id: true } } },
    });
    if (!record) {
      return { success: false, error: 'Member not found.' };
    }

    const member: Member = {
      id: record.id,
      name: record.name,
      email: record.email,
      role: record.role,
      imageUrl: record.imageUrl ?? undefined,
      teamIds: record.teams.map((team) => team.id),
      permissions: (record.permissions as any) ?? undefined,
    };
    return { success: true, member };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to get member ${id}: ${e.message}`, stack: e.stack, source: 'getMember' });
    return { success: false, error: 'Failed to fetch member.' };
  }
}

export async function updateMember(id: string, data: Partial<Omit<Member, 'id'>>): Promise<{ success: boolean; error?: string }> {
  try {
    await db.member.update({
      where: { id },
      data: {
        ...(typeof data.name === 'string' ? { name: data.name } : {}),
        ...(typeof data.email === 'string' ? { email: data.email } : {}),
        ...(typeof data.role === 'string' ? { role: data.role } : {}),
        ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl ?? null } : {}),
        ...(data.permissions !== undefined ? { permissions: (data.permissions as any) ?? null } : {}),
        ...(data.teamIds !== undefined
          ? { teams: { set: (data.teamIds ?? []).filter(Boolean).map((teamId) => ({ id: teamId })) } }
          : {}),
      },
    });
    revalidatePath(`/manage/members`);
    revalidatePath(`/manage/members/${id}`);
    return { success: true };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to update member ${id}: ${e.message}`, stack: e.stack, source: 'updateMember' });
    return { success: false, error: 'Failed to update member.' };
  }
}

export async function deleteMember(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await db.member.delete({ where: { id } });
    revalidatePath('/manage/members');
    return { success: true };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to delete member ${id}: ${e.message}`, stack: e.stack, source: 'deleteMember' });
    return { success: false, error: 'Failed to delete member.' };
  }
}
