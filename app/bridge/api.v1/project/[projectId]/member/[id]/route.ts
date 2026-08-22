/*
::neup.documentation::bridge-api-v1-project-member-detail
::api GET /bridge/api.v1/project/[projectId]/member/[id]

Fetches one project member by id or slug lookup.

::public

Lookup rules:
- `id.some-value` searches the project by exact member id.
- `slug.some-value` searches the project by exact persisted member slug.
- Bare values search by exact member id.

Returns the bridge member directory item for that project member.

::public end
::end
*/

import { NextResponse } from 'next/server';

import { getProjectMember } from '@/services/bridge/project-members';

export async function GET(_request: Request, context: { params: Promise<{ projectId: string; id: string }> }) {
  const { projectId, id } = await context.params;

  if (!projectId.trim()) {
    return NextResponse.json({ success: false, error: 'Project ID is required.' }, { status: 400 });
  }

  if (!id.trim()) {
    return NextResponse.json({ success: false, error: 'Member lookup is required.' }, { status: 400 });
  }

  try {
    const result = await getProjectMember(projectId.trim(), id.trim());

    if (!result.success) {
      return NextResponse.json(result, { status: result.error === 'Member lookup is required.' ? 400 : 404 });
    }

    return NextResponse.json({
      success: true,
      data: result.member,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch member.' }, { status: 500 });
  }
}
