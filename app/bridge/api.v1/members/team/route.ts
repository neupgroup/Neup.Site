import { NextResponse } from 'next/server';
import { createTeam, getTeams } from '@/services/teams';

export async function GET() {
  const result = await getTeams();
  return NextResponse.json(result, { status: result.success ? 200 : 404 });
}

export async function POST(request: Request) {
  try {
    const result = await createTeam(await request.json());
    return NextResponse.json(result, { status: result.success ? 201 : 400 });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
  }
}
