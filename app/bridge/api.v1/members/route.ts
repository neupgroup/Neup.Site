import { NextResponse } from 'next/server';
import { createMember, getMembers } from '@/services/members';

export async function GET() {
  const result = await getMembers();
  return NextResponse.json(result, { status: result.success ? 200 : 404 });
}

export async function POST(request: Request) {
  try {
    const result = await createMember(await request.json());
    return NextResponse.json(result, { status: result.success ? 201 : 400 });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
  }
}
