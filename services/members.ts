
'use server';

import { db } from '@/core/lib/db';
import { revalidatePath } from 'next/cache';
import type { Member } from '@/schemas/member';
import { logErrorToDatabase } from '@/core/lib/logging';

/*
::neup.documentation::member-service

::public

Service functions for member CRUD and team assignment.

The current management landing page is `/manage/member`, so mutations refresh
that route while still keeping team detail pages current.

::public end
::end
*/

export async function createMember(data: Omit<Member, 'id'>): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const lastMember = await db.member.findFirst({
      orderBy: [{ order: 'desc' }, { id: 'desc' }],
      select: { order: true },
    });
    const record = await db.member.create({
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        imageUrl: data.imageUrl ?? null,
        order: data.order ?? ((lastMember?.order ?? 0) + 1),
        teamId: data.teamId ?? null,
        permissions: data.permissions ? (data.permissions as any) : undefined,
      },
      select: { id: true },
    });
    revalidatePath('/manage/member');
    revalidatePath('/manage/team');
    return { success: true, id: record.id };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to create member: ${e.message}`, stack: e.stack, source: 'createMember' });
    return { success: false, error: 'Failed to create member.' };
  }
}

export async function getMembers(): Promise<{ success: boolean; members?: Member[]; error?: string }> {
  try {
    const records = await db.member.findMany({
      orderBy: [{ order: 'asc' }, { name: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        imageUrl: true,
        order: true,
        teamId: true,
        permissions: true,
      },
    });

    const members = records.map((record) => ({
      id: record.id,
      name: record.name,
      email: record.email,
      role: record.role,
      imageUrl: record.imageUrl ?? undefined,
      order: record.order ?? undefined,
      teamId: record.teamId ?? undefined,
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
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        imageUrl: true,
        order: true,
        teamId: true,
        permissions: true,
      },
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
      order: record.order ?? undefined,
      teamId: record.teamId ?? undefined,
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
        ...(data.order !== undefined ? { order: data.order ?? null } : {}),
        ...(data.teamId !== undefined ? { teamId: data.teamId ?? null } : {}),
        ...(data.permissions !== undefined ? { permissions: (data.permissions as any) ?? null } : {}),
      },
    });
    revalidatePath('/manage/member');
    revalidatePath('/manage/team');
    return { success: true };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to update member ${id}: ${e.message}`, stack: e.stack, source: 'updateMember' });
    return { success: false, error: 'Failed to update member.' };
  }
}

export async function deleteMember(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await db.member.delete({ where: { id } });
    revalidatePath('/manage/member');
    revalidatePath('/manage/team');
    return { success: true };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to delete member ${id}: ${e.message}`, stack: e.stack, source: 'deleteMember' });
    return { success: false, error: 'Failed to delete member.' };
  }
}

export async function saveMemberOrder(memberIds: string[]): Promise<{ success: boolean; error?: string }> {
  try {
    const uniqueMemberIds = Array.from(new Set(memberIds.filter(Boolean)));

    await db.$transaction(
      uniqueMemberIds.map((memberId, index) =>
        db.member.update({
          where: { id: memberId },
          data: { order: index + 1 },
        }),
      ),
    );

    revalidatePath('/manage/member');
    revalidatePath('/manage/team');
    return { success: true };
  } catch (e: any) {
    await logErrorToDatabase({ message: `Failed to save member order: ${e.message}`, stack: e.stack, source: 'saveMemberOrder' });
    return { success: false, error: 'Failed to save member order.' };
  }
}
