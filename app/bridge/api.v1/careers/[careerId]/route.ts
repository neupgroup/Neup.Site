/*
 * Career detail API.
 *
 * Fetch request:
 *   curl https://example.com/bridge/api.v1/careers/slug--CAREER_UUID \
 *     -H 'x-project: PROJECT_ID'
 *
 * Fetch response:
 *   { "success": true, "data": { "id": "career_123", "title": "Designer", "status": "Open" } }
 *
 * Update request:
 *   curl -X PATCH https://example.com/bridge/api.v1/careers/slug--CAREER_UUID \
 *     -H 'x-project: PROJECT_ID' -H 'token: API_TOKEN' \
 *     -H 'content-type: application/json' --data '{"status":"Closed"}'
 *
 * Update response:
 *   { "success": true }
 *
 * Delete request:
 *   curl -X DELETE https://example.com/bridge/api.v1/careers/slug--CAREER_UUID \
 *     -H 'x-project: PROJECT_ID' -H 'token: API_TOKEN'
 *
 * Delete response:
 *   { "success": true }
 */
import { NextResponse } from 'next/server';
import { deleteJobPosting, getJobPostingById, updateJobPosting } from '@/services/hiring';
import { parseCareerReference } from '@/services/career-reference';
import { requireProject } from '../../members/_helpers';

function publicCareer<T extends { id: string }>(career: T) {
  const { id: _id, ...withoutId } = career;
  return withoutId;
}

type Context = { params: Promise<{ careerId: string }> };

export async function GET(request: Request, context: Context) {
  const validation = await requireProject(request);
  if (validation instanceof Response) return validation;
  const result = await getJobPostingById((await context.params).careerId);
  return NextResponse.json({ success: result.success, data: result.posting ? publicCareer(result.posting) : undefined, error: result.error }, { status: result.success ? 200 : 404 });
}

export async function PATCH(request: Request, context: Context) {
  const validation = await requireProject(request);
  if (validation instanceof Response) return validation;
  if (!validation.authenticated) return NextResponse.json({ success: false, error: 'Authentication token is required.' }, { status: 401 });
  try {
    const reference = parseCareerReference((await context.params).careerId);
    if (!reference) return NextResponse.json({ success: false, error: 'Career reference is invalid.' }, { status: 400 });
    const result = await updateJobPosting(reference.id, await request.json());
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch { return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 }); }
}

export async function DELETE(request: Request, context: Context) {
  const validation = await requireProject(request);
  if (validation instanceof Response) return validation;
  if (!validation.authenticated) return NextResponse.json({ success: false, error: 'Authentication token is required.' }, { status: 401 });
  const reference = parseCareerReference((await context.params).careerId);
  if (!reference) return NextResponse.json({ success: false, error: 'Career reference is invalid.' }, { status: 400 });
  const result = await deleteJobPosting(reference.id);
  return NextResponse.json(result, { status: result.success ? 200 : 404 });
}
