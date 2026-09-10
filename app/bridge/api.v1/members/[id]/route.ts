import { NextResponse } from 'next/server';
import { deleteMember, getMember, updateMember } from '@/services/members';

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const result = await getMember((await context.params).id);
  return NextResponse.json(result, { status: result.success ? 200 : 404 });
}

export async function PATCH(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const result = await updateMember(id, await request.json());
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: Context) {
  const result = await deleteMember((await context.params).id);
  return NextResponse.json(result, { status: result.success ? 200 : 404 });
}
