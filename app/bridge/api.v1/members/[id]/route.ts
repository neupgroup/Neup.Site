import { NextResponse } from 'next/server';
import { deleteMember, getMember, updateMember } from '@/services/members';

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const result = await getMember((await context.params).id);
  if (result.success && result.member?.status === 'hidden') {
    return NextResponse.json({ success: false, error: 'Member not found.' }, { status: 404 });
  }
  return NextResponse.json(result, { status: result.success ? 200 : 404 });
}

export async function PATCH(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    if (body.status !== undefined && !['active', 'paused', 'hidden'].includes(body.status)) {
      return NextResponse.json({ success: false, error: 'Invalid status. Use active, paused, or hidden.' }, { status: 422 });
    }
    const result = await updateMember(id, body);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: Context) {
  const result = await deleteMember((await context.params).id);
  return NextResponse.json(result, { status: result.success ? 200 : 404 });
}
