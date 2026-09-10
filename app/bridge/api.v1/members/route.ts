import { NextResponse } from 'next/server';
import { createMember, getMembers } from '@/services/members';
import { logApiError, requireProject } from './_helpers';

export async function GET(request: Request) {
  const validation = await requireProject(request);
  if (validation) return validation;
  try {
    const result = await getMembers();
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (error) {
    await logApiError('bridge.members.get', error);
    return NextResponse.json({ success: false, error: 'Unable to load members right now.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const validation = await requireProject(request);
  if (validation) return validation;
  try {
    const result = await createMember(await request.json());
    return NextResponse.json(result, { status: result.success ? 201 : 400 });
  } catch (error) {
    await logApiError('bridge.members.post', error);
    return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
  }
}
