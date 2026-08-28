
'use server';

import { prisma as db } from '#/core/database/prisma';
import { slugify } from '#/core/helpers/slug';
import { revalidatePath } from 'next/cache';
import { getActiveProjectId } from '@/services/projects';
import type { Team } from '@/services/team/type';
import { logger } from '#/logica/logger';

/*
::neup.documentation::team-service

::public

Service functions for team CRUD used by the management routes.

These functions refresh `/manage/member` and team detail pages after changes.

::public end
::end
*/

interface TeamBoardGroupOrder {
  teamId: string | null;
  memberIds: string[];
}

interface TeamBoardOrderInput {
  teamIds: string[];
  groups: TeamBoardGroupOrder[];
}

async function getTeamAssetId(): Promise<string> {
  const assetId = await getActiveProjectId();
  if (!assetId) {
    throw new Error('Asset ID not found.');
  }
  return assetId;
}

async function resolveUniqueTeamSlug(assetId: string, name: string, excludeId?: string) {
  const baseSlug = slugify(name, 'team');
  const existingTeams = await db.team.findMany({
    where: {
      assetId,
      ...(excludeId ? { id: { not: excludeId } } : {}),
      slug: {
        startsWith: baseSlug,
      },
    },
    select: { slug: true },
    orderBy: { slug: 'asc' },
  });

  const existingSlugs = new Set(existingTeams.map((team) => team.slug));
  if (!existingSlugs.has(baseSlug)) {
    return baseSlug;
  }

  let suffix = 2;
  while (existingSlugs.has(`${baseSlug}-${suffix}`)) {
    suffix += 1;
  }

  return `${baseSlug}-${suffix}`;
}

export async function createTeam(data: Omit<Team, 'id'>): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const assetId = await getTeamAssetId();
    const slug = await resolveUniqueTeamSlug(assetId, data.name);
    const record = await db.team.create({
      data: {
        assetId,
        slug,
        name: data.name,
        description: data.description ?? null,
        order: data.order ?? null,
      },
      select: { id: true },
    });
    revalidatePath('/manage/member');
    revalidatePath('/manage/team');
    return { success: true, id: record.id };
  } catch (e: any) {
    await logger.error({ message: `Failed to create team: ${e.message}`, stack: e.stack, source: 'createTeam' });
    return { success: false, error: 'Failed to create team.' };
  }
}

export async function getTeams(): Promise<{ success: boolean; teams?: Team[]; error?: string }> {
  try {
    const assetId = await getTeamAssetId();
    const records = await db.team.findMany({
      where: { assetId },
      orderBy: [{ order: 'asc' }, { id: 'asc' }],
      select: { id: true, assetId: true, slug: true, name: true, description: true, order: true },
    });

    const teams = records.map((record) => ({
      id: record.id,
      assetId: record.assetId,
      slug: record.slug,
      name: record.name,
      description: record.description ?? undefined,
      order: record.order ?? undefined,
    })) as Team[];
    return { success: true, teams };
  } catch (e: any) {
    await logger.error({ message: `Failed to get teams: ${e.message}`, stack: e.stack, source: 'getTeams' });
    return { success: false, error: 'Failed to fetch teams.' };
  }
}

export async function getTeam(id: string): Promise<{ success: boolean; team?: Team; error?: string }> {
    try {
        const assetId = await getTeamAssetId();
        const record = await db.team.findFirst({
          where: {
            id,
            assetId,
          },
          select: { id: true, assetId: true, slug: true, name: true, description: true, order: true },
        });
        if (!record) {
            return { success: false, error: 'Team not found.' };
        }

        const team: Team = {
            id: record.id,
            assetId: record.assetId,
            slug: record.slug,
            name: record.name,
            description: record.description ?? undefined,
            order: record.order ?? undefined,
        };
        return { success: true, team };
    } catch (e: any) {
        await logger.error({ message: `Failed to get team ${id}: ${e.message}`, stack: e.stack, source: 'getTeam' });
        return { success: false, error: 'Failed to fetch team.' };
    }
}

export async function updateTeam(id: string, data: Partial<Omit<Team, 'id'>>): Promise<{ success: boolean; error?: string }> {
  try {
    const assetId = await getTeamAssetId();
    const slug = typeof data.name === 'string' ? await resolveUniqueTeamSlug(assetId, data.name, id) : undefined;
    const result = await db.team.updateMany({
      where: {
        id,
        assetId,
      },
      data: {
        assetId,
        ...(slug ? { slug } : {}),
        ...(typeof data.name === 'string' ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description ?? null } : {}),
        ...(data.order !== undefined ? { order: data.order ?? null } : {}),
      },
    });
    if (result.count === 0) {
      return { success: false, error: 'Team not found.' };
    }
    revalidatePath('/manage/member');
    revalidatePath('/manage/team');
    revalidatePath(`/manage/team/${id}`);
    return { success: true };
  } catch (e: any) {
    await logger.error({ message: `Failed to update team ${id}: ${e.message}`, stack: e.stack, source: 'updateTeam' });
    return { success: false, error: 'Failed to update team.' };
  }
}

export async function deleteTeam(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const assetId = await getTeamAssetId();
    const result = await db.team.deleteMany({
      where: {
        id,
        assetId,
      },
    });
    if (result.count === 0) {
      return { success: false, error: 'Team not found.' };
    }
    revalidatePath('/manage/member');
    revalidatePath('/manage/team');
    return { success: true };
  } catch (e: any) {
    await logger.error({ message: `Failed to delete team ${id}: ${e.message}`, stack: e.stack, source: 'deleteTeam' });
    return { success: false, error: 'Failed to delete team.' };
  }
}

export async function saveTeamBoardOrder(input: TeamBoardOrderInput): Promise<{ success: boolean; error?: string }> {
  try {
    const assetId = await getTeamAssetId();
    const teamIds = Array.from(new Set(input.teamIds.filter(Boolean)));
    const memberAssignments = input.groups.flatMap((group) =>
      group.memberIds.map((memberId) => ({
        memberId,
        teamId: group.teamId,
      })),
    );

    const memberIds = new Set<string>();
    const duplicateMemberId = memberAssignments.find((assignment) => {
      if (memberIds.has(assignment.memberId)) {
        return true;
      }

      memberIds.add(assignment.memberId);
      return false;
    });

    if (duplicateMemberId) {
      return { success: false, error: 'A member can only be placed once on the team board.' };
    }

    const [existingTeams, existingMembers] = await Promise.all([
      db.team.findMany({
        where: {
          id: { in: teamIds },
          assetId,
        },
        select: { id: true },
      }),
      db.member.findMany({
        where: {
          id: { in: memberAssignments.map((assignment) => assignment.memberId) },
          assetId,
        },
        select: { id: true },
      }),
    ]);

    if (existingTeams.length !== teamIds.length || existingMembers.length !== memberAssignments.length) {
      return { success: false, error: 'One or more teams or members could not be found for this asset.' };
    }

    await db.$transaction([
      ...teamIds.map((teamId, index) =>
        db.team.updateMany({
          where: {
            id: teamId,
            assetId,
          },
          data: { assetId, order: index + 1 },
        }),
      ),
      ...memberAssignments.map((assignment, index) =>
        db.member.updateMany({
          where: {
            id: assignment.memberId,
            assetId,
          },
          data: {
            assetId,
            order: index + 1,
            teamId: assignment.teamId,
          },
        }),
      ),
    ]);

    revalidatePath('/manage/member');
    revalidatePath('/manage/team');
    for (const teamId of teamIds) {
      revalidatePath(`/manage/team/${teamId}`);
    }

    return { success: true };
  } catch (e: any) {
    await logger.error({ message: `Failed to save team board order: ${e.message}`, stack: e.stack, source: 'saveTeamBoardOrder' });
    return { success: false, error: 'Failed to save team board order.' };
  }
}
