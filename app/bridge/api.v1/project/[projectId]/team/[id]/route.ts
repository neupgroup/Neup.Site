/*
::neup.documentation::bridge-api-v1-project-team-detail
::api GET /bridge/api.v1/project/[projectId]/team/[id]

Fetches one project team by id or slug lookup.

::public

Lookup rules:
- `id.some-value` searches the project by exact team id.
- `slug.some-value` searches the project by exact persisted team slug.
- Bare values search by exact team id.

Returns the team and its assigned members.

::public end
::end
*/

import { NextResponse } from 'next/server';

import { getProjectTeam } from '@/services/bridge/project-teams';

export async function GET(_request: Request, context: { params: Promise<{ projectId: string; id: string }> }) {
  const { projectId, id } = await context.params;

  if (!projectId.trim()) {
    return NextResponse.json({ success: false, error: 'Project ID is required.' }, { status: 400 });
  }

  if (!id.trim()) {
    return NextResponse.json({ success: false, error: 'Team lookup is required.' }, { status: 400 });
  }

  try {
    const result = await getProjectTeam(projectId.trim(), id.trim());

    if (!result.success) {
      return NextResponse.json(result, { status: result.error === 'Team lookup is required.' ? 400 : 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        team: result.team,
        members: result.members,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch team.' }, { status: 500 });
  }
}
