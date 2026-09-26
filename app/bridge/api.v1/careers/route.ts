/*
 * Careers collection API.
 *
 * Public request:
 *   curl https://example.com/bridge/api.v1/careers \
 *     -H 'x-project: PROJECT_ID'
 *
 * Public response:
 *   { "success": true, "data": [{ "id": "career_123", "title": "Designer", "status": "Open" }] }
 *
 * Authenticated create request:
 *   curl -X POST https://example.com/bridge/api.v1/careers \
 *     -H 'x-project: PROJECT_ID' -H 'token: API_TOKEN' \
 *     -H 'content-type: application/json' \
 *     --data '{"title":"Designer","location":"Remote","type":"Full-time","status":"Open"}'
 *
 * Create response:
 *   { "success": true, "id": "career_123" }
 */
import { NextResponse } from 'next/server';
import { createJobPosting, getJobPostings } from '@/services/hiring';
import { getProjectHiring } from '@/services/bridge/project-hiring';
import { logApiError, requireProject } from '../members/_helpers';

function publicCareer<T extends { id: string }>(career: T) {
  const { id: _id, ...withoutId } = career;
  return withoutId;
}

export async function GET(request: Request) {
  const validation = await requireProject(request);
  if (validation instanceof Response) return validation;
  try {
    if (!validation.authenticated) {
      const result = await getProjectHiring(validation.projectId);
      return NextResponse.json({ success: result.success, data: result.success ? result.postings.map(publicCareer) : undefined, error: result.error }, { status: result.success ? 200 : 404 });
    }
    const result = await getJobPostings();
    return NextResponse.json({ success: result.success, data: result.postings?.map(publicCareer), error: result.error }, { status: result.success ? 200 : 500 });
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
