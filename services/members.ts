
'use server';

import { prisma as db } from '@/core/database/prisma';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import type { Member } from '@/services/member/type';
import { logErrorToDatabase } from '@/core/helpers/logger';

/*
::neup.documentation::member-service

::public

Service functions for member CRUD and team assignment.

The current management landing page is `/manage/member`, so mutations refresh
that route while still keeping team detail pages current.

::public end
::end
*/

async function getMemberAssetId(): Promise<string> {
  const assetId = (await cookies()).get('assetId')?.value;
  if (!assetId) {
    throw new Error('Asset ID not found.');
  }
  return assetId;
}

export async function createMember(data: Omit<Member, 'id'>): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const assetId = await getMemberAssetId();
    if (data.teamId) {
      const team = await db.team.findFirst({
        where: {
          id: data.teamId,
          assetId,
        },
        select: { id: true },
      });
      if (!team) {
        return { success: false, error: 'Team not found for this asset.' };
      }
    }
    const lastMember = await db.member.findFirst({
      where: { assetId },
      orderBy: [{ order: 'desc' }, { id: 'desc' }],
      select: { order: true },
    });
    const record = await db.member.create({
      data: {
        assetId,
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
    const assetId = await getMemberAssetId();
    const records = await db.member.findMany({
      where: { assetId },
      orderBy: [{ order: 'asc' }, { name: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        assetId: true,
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
      assetId: record.assetId,
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
    const assetId = await getMemberAssetId();
    const record = await db.member.findFirst({
      where: {
        id,
        assetId,
      },
      select: {
        id: true,
        assetId: true,
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
      assetId: record.assetId,
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
    const assetId = await getMemberAssetId();
    if (data.teamId) {
      const team = await db.team.findFirst({
        where: {
          id: data.teamId,
          assetId,
        },
        select: { id: true },
      });
      if (!team) {
        return { success: false, error: 'Team not found for this asset.' };
      }
    }
    const result = await db.member.updateMany({
      where: {
        id,
        assetId,
      },
      data: {
        assetId,
        ...(typeof data.name === 'string' ? { name: data.name } : {}),
        ...(typeof data.email === 'string' ? { email: data.email } : {}),
        ...(typeof data.role === 'string' ? { role: data.role } : {}),
        ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl ?? null } : {}),
        ...(data.order !== undefined ? { order: data.order ?? null } : {}),
        ...(data.teamId !== undefined ? { teamId: data.teamId ?? null } : {}),
        ...(data.permissions !== undefined ? { permissions: (data.permissions as any) ?? null } : {}),
      },
    });
    if (result.count === 0) {
      return { success: false, error: 'Member not found.' };
    }
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
    const assetId = await getMemberAssetId();
    const result = await db.member.deleteMany({
      where: {
        id,
        assetId,
      },
    });
    if (result.count === 0) {
      return { success: false, error: 'Member not found.' };
    }
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
    const assetId = await getMemberAssetId();
    const uniqueMemberIds = Array.from(new Set(memberIds.filter(Boolean)));

    const existingMembers = await db.member.findMany({
      where: {
        id: { in: uniqueMemberIds },
        assetId,
      },
      select: { id: true },
    });

    if (existingMembers.length !== uniqueMemberIds.length) {
      return { success: false, error: 'One or more members could not be found for this asset.' };
    }

    await db.$transaction(
      uniqueMemberIds.map((memberId, index) =>
        db.member.updateMany({
          where: {
            id: memberId,
            assetId,
          },
          data: { assetId, order: index + 1 },
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
