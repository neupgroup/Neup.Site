'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

import { prisma as db } from '#/core/database/prisma';
import { getAccountId } from '@/services/accounts';

/*
::neup.documentation::project-context-service

Resolves the active project for the current request.

::end
*/

const SELECTED_PROJECT_QUERY_PARAM = 'selectedProject';
const SELECTED_PROJECT_HEADER = 'x-selected-project';

export interface ManagedProjectUser {
  accountId: string;
  displayName: string;
  displayImage: string;
  neupId: string | null;
  roles: string[];
  isOwner: boolean;
}

export interface ManagedProjectSummary {
  id: string;
  name: string;
  status: string | null;
  type: string | null;
  createdAt: string | null;
  totalUsers: number;
  isCurrentProject: boolean;
  users: ManagedProjectUser[];
}

function normalizeProjectId(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function readProjectIdFromUrl(rawUrl: string | null | undefined): string | null {
  const value = rawUrl?.trim();
  if (!value) return null;

  try {
    return normalizeProjectId(new URL(value, 'http://localhost').searchParams.get(SELECTED_PROJECT_QUERY_PARAM));
  } catch {
    return null;
  }
}

export async function getActiveProjectId(options?: { required?: boolean }): Promise<string | null> {
  const headerStore = await headers();

  const selectedProject =
    normalizeProjectId(headerStore.get(SELECTED_PROJECT_HEADER)) ??
    readProjectIdFromUrl(headerStore.get('referer')) ??
    readProjectIdFromUrl(headerStore.get('x-url')) ??
    readProjectIdFromUrl(headerStore.get('next-url'));

  if (selectedProject) {
    return selectedProject;
  }

  if (options?.required) {
    throw new Error('Active project not found.');
  }

  return null;
}

function formatProjectName(name: string, projectId: string) {
  const trimmedName = name.trim();
  return trimmedName || `Untitled Project (${projectId.slice(0, 8)})`;
}

function normalizeRole(value: string) {
  return value.trim().toLowerCase();
}

export async function getManagedProjectsOverview(): Promise<{
  success: boolean;
  projects?: ManagedProjectSummary[];
  error?: string;
}> {
  try {
    const accountId = await getAccountId();
    const currentProjectId = await getActiveProjectId();

    const projects = await db.asset.findMany({
      where: {
        OR: [
          { ownerAccountId: accountId },
          {
            roles: {
              some: {
                accountId,
                role: 'owner',
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        status: true,
        type: true,
        createdAt: true,
        ownerAccountId: true,
        roles: {
          select: {
            accountId: true,
            role: true,
            account: {
              select: {
                id: true,
                displayName: true,
                displayImage: true,
                neupId: true,
              },
            },
          },
        },
      },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    });

    const ownerAccountIds = Array.from(
      new Set(
        projects
          .map((project) => normalizeProjectId(project.ownerAccountId))
          .filter((value): value is string => Boolean(value)),
      ),
    );

    const ownerAccounts = ownerAccountIds.length
      ? await db.account.findMany({
          where: {
            id: {
              in: ownerAccountIds,
            },
          },
          select: {
            id: true,
            displayName: true,
            displayImage: true,
            neupId: true,
          },
        })
      : [];

    const ownerAccountMap = new Map(ownerAccounts.map((account) => [account.id, account]));

    return {
      success: true,
      projects: projects.map((project) => {
        const userMap = new Map<string, ManagedProjectUser>();

        for (const role of project.roles) {
          const existing = userMap.get(role.accountId);
          const roleName = normalizeRole(role.role);

          if (existing) {
            if (!existing.roles.includes(roleName)) {
              existing.roles.push(roleName);
              existing.roles.sort();
            }
            existing.isOwner = existing.isOwner || roleName === 'owner';
            continue;
          }

          userMap.set(role.accountId, {
            accountId: role.account.id,
            displayName: role.account.displayName,
            displayImage: role.account.displayImage,
            neupId: role.account.neupId,
            roles: [roleName],
            isOwner: roleName === 'owner',
          });
        }

        const ownerAccountId = normalizeProjectId(project.ownerAccountId);
        if (ownerAccountId) {
          const existingOwner = userMap.get(ownerAccountId);
          if (existingOwner) {
            existingOwner.isOwner = true;
            if (!existingOwner.roles.includes('owner')) {
              existingOwner.roles.push('owner');
              existingOwner.roles.sort();
            }
          } else {
            const ownerAccount = ownerAccountMap.get(ownerAccountId);
            userMap.set(ownerAccountId, {
              accountId: ownerAccountId,
              displayName: ownerAccount?.displayName ?? '',
              displayImage: ownerAccount?.displayImage ?? '',
              neupId: ownerAccount?.neupId ?? null,
              roles: ['owner'],
              isOwner: true,
            });
          }
        }

        const users = Array.from(userMap.values()).sort((left, right) => {
          const leftLabel = left.displayName.trim() || left.accountId;
          const rightLabel = right.displayName.trim() || right.accountId;
          return leftLabel.localeCompare(rightLabel) || left.accountId.localeCompare(right.accountId);
        });

        return {
          id: project.id,
          name: formatProjectName(project.name, project.id),
          status: project.status ?? null,
          type: project.type ?? null,
          createdAt: project.createdAt?.toISOString() ?? null,
          totalUsers: users.length,
          isCurrentProject: project.id === currentProjectId,
          users,
        };
      }),
    };
  } catch {
    return {
      success: false,
      error: 'Failed to load projects.',
    };
  }
}

export async function getManagedProject(projectId: string): Promise<{
  success: boolean;
  project?: ManagedProjectSummary | null;
  error?: string;
}> {
  try {
    const { projects, success, error } = await getManagedProjectsOverview();

    if (!success) {
      return {
        success: false,
        error: error ?? 'Failed to load project.',
      };
    }

    const project = (projects ?? []).find((entry) => entry.id === normalizeProjectId(projectId)) ?? null;

    return {
      success: true,
      project,
    };
  } catch {
    return {
      success: false,
      error: 'Failed to load project.',
    };
  }
}

export async function deleteManagedProject(projectId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const accountId = await getAccountId();
    const normalizedProjectId = normalizeProjectId(projectId);

    if (!normalizedProjectId) {
      return { success: false, error: 'Project ID is required.' };
    }

    const result = await db.asset.deleteMany({
      where: {
        id: normalizedProjectId,
        OR: [
          { ownerAccountId: accountId },
          {
            roles: {
              some: {
                accountId,
                role: 'owner',
              },
            },
          },
        ],
      },
    });

    if (result.count === 0) {
      return { success: false, error: 'Project not found or you do not have permission to delete it.' };
    }

    revalidatePath('/manage/projects');
    revalidatePath('/manage/access');
    revalidatePath('/switch');

    return { success: true };
  } catch {
    return {
      success: false,
      error: 'Failed to delete project.',
    };
  }
}
