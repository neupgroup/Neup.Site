/*
 * Career detail API.
 *
 * Fetch request:
 *   curl https://example.com/bridge/api.v1/careers/CAREER_ID \
 *     -H 'x-project: PROJECT_ID'
 *
 * Fetch response:
 *   { "success": true, "data": { "id": "career_123", "title": "Designer", "status": "Open" } }
 *
 * Update request:
 *   curl -X PATCH https://example.com/bridge/api.v1/careers/CAREER_ID \
 *     -H 'x-project: PROJECT_ID' -H 'token: API_TOKEN' \
 *     -H 'content-type: application/json' --data '{"status":"Closed"}'
 *
 * Update response:
 *   { "success": true }
 *
 * Delete request:
 *   curl -X DELETE https://example.com/bridge/api.v1/careers/CAREER_ID \
 *     -H 'x-project: PROJECT_ID' -H 'token: API_TOKEN'
 *
 * Delete response:
 *   { "success": true }
 */
import { NextResponse } from 'next/server';
import { deleteJobPosting, getJobPostingById, updateJobPosting } from '@/services/hiring';
import { requireProject } from '../../members/_helpers';

type Context = { params: Promise<{ careerId: string }> };

export async function GET(request: Request, context: Context) {
  const validation = await requireProject(request);
  if (validation instanceof Response) return validation;
  const result = await getJobPostingById((await context.params).careerId);
  return NextResponse.json({ success: result.success, data: result.posting, error: result.error }, { status: result.success ? 200 : 404 });
}

export async function PATCH(request: Request, context: Context) {
  const validation = await requireProject(request);
  if (validation instanceof Response) return validation;
  if (!validation.authenticated) return NextResponse.json({ success: false, error: 'Authentication token is required.' }, { status: 401 });
  try {
    const result = await updateJobPosting((await context.params).careerId, await request.json());
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch { return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 }); }
}

export async function DELETE(request: Request, context: Context) {
  const validation = await requireProject(request);
  if (validation instanceof Response) return validation;
  if (!validation.authenticated) return NextResponse.json({ success: false, error: 'Authentication token is required.' }, { status: 401 });
  const result = await deleteJobPosting((await context.params).careerId);
  return NextResponse.json(result, { status: result.success ? 200 : 404 });
}
