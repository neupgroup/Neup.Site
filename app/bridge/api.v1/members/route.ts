import { NextResponse } from 'next/server';
import { createMember, getMembers } from '@/services/members';
import { logApiError, requireProject } from './_helpers';

function apiMember(member: Record<string, unknown>) {
  const { imageUrl, ...record } = member;
  return { ...record, displayImage: imageUrl ?? null };
}

export async function GET(request: Request) {
  const validation = await requireProject(request);
  if (validation instanceof Response) return validation;
  try {
    const result = await getMembers();
    if (!result.success) return NextResponse.json(result, { status: 500 });
    if (!validation.authenticated) {
      const members = result.members
        ?.filter((member) => member.status !== 'hidden')
        .map((member) => apiMember(member as unknown as Record<string, unknown>));
      return NextResponse.json({ success: true, data: members });
    }
    const accounts = await (await import('@neup/core/database/prisma')).prisma.account.findMany({
      where: { roles: { some: { assetId: validation.projectId } } },
      select: { id: true, displayName: true, displayImage: true, status: true, type: true },
      orderBy: { displayName: 'asc' },
    });
    return NextResponse.json({
      success: true,
      data: (result.members ?? []).map((member) => apiMember(member as unknown as Record<string, unknown>)),
      accounts,
    });
  } catch (error) {
    await logApiError('bridge.members.get', error);
    return NextResponse.json({ success: false, error: 'Unable to load members right now.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const validation = await requireProject(request);
  if (validation instanceof Response) return validation;
  if (!validation.authenticated) {
    return NextResponse.json({ success: false, error: 'Authentication token is required.' }, { status: 401 });
  }
  try {
    const body = await request.json();
    if (body.status !== undefined && !['active', 'paused', 'hidden'].includes(body.status)) {
      return NextResponse.json({ success: false, error: 'Invalid status. Use active, paused, or hidden.' }, { status: 422 });
    }
    const result = await createMember(body);
    return NextResponse.json(result, { status: result.success ? 201 : 400 });
  } catch (error) {
    await logApiError('bridge.members.post', error);
    return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
  }
}
