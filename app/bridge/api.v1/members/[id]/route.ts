import { NextResponse } from 'next/server';
import { deleteMember, getMember, updateMember } from '@/services/members';
import { requireProject } from '../_helpers';

type Context = { params: Promise<{ id: string }> };

function apiMember(member: Record<string, unknown>) {
  const { id, imageUrl, slug, ...record } = member as Record<string, unknown> & { id?: string; imageUrl?: string | null; slug?: string };
  return { ...record, slug: `${slug}--${id}`, displayImage: imageUrl ?? null };
}

function parseMemberReference(reference: string) {
  const separator = reference.lastIndexOf('--');
  if (separator <= 0 || separator === reference.length - 2) return null;
  return { slug: reference.slice(0, separator), id: reference.slice(separator + 2) };
}

export async function GET(_request: Request, context: Context) {
  const validation = await requireProject(_request);
  if (validation instanceof Response) return validation;
  const reference = parseMemberReference((await context.params).id);
  if (!reference) {
    return NextResponse.json({ success: false, error: 'Member reference must use slug--id.' }, { status: 400 });
  }
  const result = await getMember(reference.id);
  if (result.success && result.member?.slug !== reference.slug) {
    return NextResponse.json({ success: false, error: 'Member not found.' }, { status: 404 });
  }
  return NextResponse.json({
    success: result.success,
    data: result.member ? apiMember(result.member as unknown as Record<string, unknown>) : undefined,
    error: result.error,
  }, { status: result.success ? 200 : 404 });
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
