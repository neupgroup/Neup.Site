import { NextResponse } from 'next/server';
import { getBuildFile } from '@/services/build';

export async function GET(request: Request, props: { params: Promise<{ siteid: string }> }) {
  const { siteid } = await props.params;
  const { searchParams } = new URL(request.url);
  const requestedPath = searchParams.get('path');

  if (!requestedPath) {
    return NextResponse.json({ success: false, error: 'Path parameter is missing.' }, { status: 400 });
  }

  const result = await getBuildFile(siteid, requestedPath);
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }

  return new Response(result.content, {
    status: 200,
    headers: {
      'Content-Type': result.contentType,
      'Cache-Control': 'no-store',
    },
  });
}
