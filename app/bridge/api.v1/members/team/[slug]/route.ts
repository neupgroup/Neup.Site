import { NextResponse } from 'next/server';
import { deleteTeam, getTeam, updateTeam } from '@/services/teams';

type Context = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: Context) {
  const result = await getTeam((await context.params).slug);
  return NextResponse.json(result, { status: result.success ? 200 : 404 });
}

export async function PATCH(request: Request, context: Context) {
  try {
    const { slug: id } = await context.params;
    const result = await updateTeam(id, await request.json());
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: Context) {
  const result = await deleteTeam((await context.params).slug);
  return NextResponse.json(result, { status: result.success ? 200 : 404 });
}
