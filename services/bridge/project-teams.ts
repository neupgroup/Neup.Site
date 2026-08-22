import { prisma as db } from '@/core/database/prisma';

/*
::neup.documentation::bridge-project-team-service

::public

Bridge-facing team queries scoped to an explicit project id.

Supports listing all teams for a project and resolving a single team by either
its database id or its persisted slug.

::public end
::end
*/

export interface BridgeProjectTeam {
  id: string;
  assetId: string;
  slug: string;
  name: string;
  description: string | null;
  order: number | null;
}

type TeamLookup =
  | { kind: 'id'; value: string }
  | { kind: 'slug'; value: string };

function normalizeLookupValue(value: string) {
  return value.trim();
}

export function parseTeamLookup(rawValue: string): TeamLookup | null {
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

function mapTeam(record: BridgeProjectTeam): BridgeProjectTeam {
  return {
    id: record.id,
    assetId: record.assetId,
    slug: record.slug,
    name: record.name,
    description: record.description,
    order: record.order,
  };
}

export async function getProjectTeam(projectId: string, rawLookup: string) {
  const lookup = parseTeamLookup(rawLookup);
  if (!lookup) {
    return { success: false as const, error: 'Team lookup is required.' };
  }

  const where =
    lookup.kind === 'slug'
      ? { assetId: projectId, slug: lookup.value }
      : { assetId: projectId, id: lookup.value };

  const team = await db.team.findFirst({
    where,
    select: {
      id: true,
      assetId: true,
      slug: true,
      name: true,
      description: true,
      order: true,
    },
  });

  if (!team) {
    return { success: false as const, error: 'Team not found.' };
  }

  const members = await db.member.findMany({
    where: {
      assetId: projectId,
      teamId: team.id,
    },
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
    },
  });

  return {
    success: true as const,
    team: mapTeam(team),
    members,
  };
}
