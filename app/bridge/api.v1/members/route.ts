import { NextResponse } from 'next/server';
import { createMember, getMembers } from '@/services/members';
import { logApiError, requireProject } from './_helpers';

export async function GET(request: Request) {
  const validation = await requireProject(request);
  if (validation) return validation;
  try {
    const result = await getMembers();
    if (!result.success) return NextResponse.json(result, { status: 500 });
    return NextResponse.json({ ...result, members: result.members?.filter((member) => member.status !== 'hidden') });
  } catch (error) {
    await logApiError('bridge.members.get', error);
    return NextResponse.json({ success: false, error: 'Unable to load members right now.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const validation = await requireProject(request);
  if (validation) return validation;
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
