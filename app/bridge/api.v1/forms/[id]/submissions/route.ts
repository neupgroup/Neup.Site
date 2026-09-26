import { NextResponse } from 'next/server';
import { createFormSubmission } from '@/services/forms';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const projectId = request.headers.get('x-project')?.trim();
  if (!projectId) return NextResponse.json({ success: false, error: 'x-project header is required.' }, { status: 400 });
  try {
    const body = await request.json();
    const result = await createFormSubmission(projectId, (await params).id, body);
    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Invalid request body.' }, { status: 400 });
  }
}
