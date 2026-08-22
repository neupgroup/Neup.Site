import { prisma as db } from '@/core/database/prisma';

/*
::neup.documentation::bridge-project-member-service

::public

Bridge-facing member queries scoped to an explicit project id.

Supports listing all project members and resolving one member by either its
database id or its persisted slug.

::public end
::end
*/

export interface BridgeProjectMemberDirectoryItem {
  id: string;
  displayName: string;
  position: string;
  displayImage: string | null;
  slug: string;
  socials: Array<{ platformName: string; url: string }>;
  description: string | null;
  moreDetails: unknown[];
  teamId: string | null;
  teamTitle: string | null;
  teamSlug: string | null;
  teamDescription: string | null;
}

type MemberLookup =
  | { kind: 'id'; value: string }
  | { kind: 'slug'; value: string };

function normalizeLookupValue(value: string) {
  return value.trim();
}

export function parseMemberLookup(rawValue: string): MemberLookup | null {
  const value = normalizeLookupValue(rawValue);
  if (!value) {
    return null;
  }

  if (value.startsWith('id.')) {
    const id = normalizeLookupValue(value.slice(3));
    return id ? { kind: 'id', value: id } : null;
  }

  if (value.startsWith('slug.')) {
    const slug = normalizeLookupValue(value.slice(5));
    return slug ? { kind: 'slug', value: slug } : null;
  }

  return { kind: 'id', value };
}

function mapDirectoryItem(record: {
  id: string;
  slug: string;
  name: string;
  role: string;
  imageUrl: string | null;
  teamId: string | null;
  team: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
  } | null;
}): BridgeProjectMemberDirectoryItem {
  return {
    id: record.id,
    displayName: record.name,
    position: record.role,
    displayImage: record.imageUrl,
    slug: record.slug,
    socials: [],
    description: null,
    moreDetails: [],
    teamId: record.team?.id ?? record.teamId ?? null,
    teamTitle: record.team?.name ?? null,
    teamSlug: record.team?.slug ?? null,
    teamDescription: record.team?.description ?? null,
  };
}

async function ensureProject(projectId: string) {
  return db.asset.findUnique({
    where: { id: projectId },
    select: { id: true },
  });
}

export async function getProjectMembers(projectId: string) {
  const project = await ensureProject(projectId);
  if (!project) {
    return { success: false as const, error: 'Project not found.' };
  }

  const records = await db.member.findMany({
    where: { assetId: projectId },
    orderBy: [{ order: 'asc' }, { name: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      slug: true,
      name: true,
      role: true,
      imageUrl: true,
      teamId: true,
      team: {
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
        },
      },
    },
  });

  return {
    success: true as const,
    members: records.map(mapDirectoryItem),
  };
}

export async function getProjectMember(projectId: string, rawLookup: string) {
  const project = await ensureProject(projectId);
  if (!project) {
    return { success: false as const, error: 'Project not found.' };
  }

  const lookup = parseMemberLookup(rawLookup);
  if (!lookup) {
    return { success: false as const, error: 'Member lookup is required.' };
  }

  const where =
    lookup.kind === 'slug'
      ? { assetId: projectId, slug: lookup.value }
      : { assetId: projectId, id: lookup.value };

  const record = await db.member.findFirst({
    where,
    select: {
      id: true,
      slug: true,
      name: true,
      role: true,
      imageUrl: true,
      teamId: true,
      team: {
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
        },
      },
    },
  });

  if (!record) {
    return { success: false as const, error: 'Member not found.' };
  }

  return {
    success: true as const,
    member: mapDirectoryItem(record),
  };
}
