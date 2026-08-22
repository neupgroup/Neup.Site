/*
::neup.documentation::bridge-api-v1-project-team-list
::api GET /bridge/api.v1/project/[projectId]/team

Lists project members with their team metadata.

::public

Returns member directory items shaped for bridge consumers, including the
assigned team's id, title, slug, and description when available.

::public end
::end
*/

import { NextResponse } from 'next/server';

import { getProjectMembers } from '@/services/bridge/project-members';

export async function GET(_request: Request, context: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await context.params;

  if (!projectId.trim()) {
    return NextResponse.json({ success: false, error: 'Project ID is required.' }, { status: 400 });
  }

  try {
    const result = await getProjectMembers(projectId.trim());

    if (!result.success) {
      return NextResponse.json(result, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result.members });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch members.' }, { status: 500 });
  }
}
