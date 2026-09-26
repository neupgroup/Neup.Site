import { NextResponse } from 'next/server';
import { createJobPosting, getJobPostings } from '@/services/hiring';
import { getProjectHiring } from '@/services/bridge/project-hiring';
import { logApiError, requireProject } from '../members/_helpers';

export async function GET(request: Request) {
  const validation = await requireProject(request);
  if (validation instanceof Response) return validation;
  try {
    if (!validation.authenticated) {
      const result = await getProjectHiring(validation.projectId);
      return NextResponse.json({ success: result.success, careers: result.success ? result.postings : undefined, error: result.error }, { status: result.success ? 200 : 404 });
    }
    const result = await getJobPostings();
    return NextResponse.json({ success: result.success, careers: result.postings, error: result.error }, { status: result.success ? 200 : 500 });
  } catch (error) {
    await logApiError('bridge.careers.get', error);
    return NextResponse.json({ success: false, error: 'Unable to load careers right now.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const validation = await requireProject(request);
  if (validation instanceof Response) return validation;
  if (!validation.authenticated) return NextResponse.json({ success: false, error: 'Authentication token is required.' }, { status: 401 });
  try {
    const result = await createJobPosting(await request.json());
    return NextResponse.json(result, { status: result.success ? 201 : 400 });
  } catch (error) {
    await logApiError('bridge.careers.post', error);
    return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
  }
}
