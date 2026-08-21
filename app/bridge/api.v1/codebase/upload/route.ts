import { NextRequest, NextResponse } from 'next/server';
import { saveCodeFileByPath } from '@/services/codebase';

async function readRequestContent(request: NextRequest): Promise<{ success: true; content: string } | { success: false; error: string }> {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      const body = await request.json();
      if (typeof body?.content !== 'string') {
        return { success: false, error: 'JSON body must include a string `content` field.' };
      }

      return { success: true, content: body.content };
    } catch {
      return { success: false, error: 'Invalid JSON body.' };
    }
  }

  const content = await request.text();
  if (!content.length) {
    return { success: false, error: 'Request body is empty.' };
  }

  return { success: true, content };
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get('path');

  if (!filePath) {
    return NextResponse.json({ success: false, error: 'Path parameter is missing.' }, { status: 400 });
  }

  const body = await readRequestContent(request);
  if (!body.success) {
    return NextResponse.json({ success: false, error: body.error }, { status: 400 });
  }

  const result = await saveCodeFileByPath({
    filePath,
    content: body.content,
  });

  if (!result.success) {
    const status = result.error === 'Asset ID not found.' || result.error === 'Invalid file path.' ? 400 : 500;
    return NextResponse.json({ success: false, error: result.error }, { status });
  }

  return NextResponse.json(
    {
      success: true,
      id: result.id,
      path: filePath,
      created: result.created,
    },
    { status: result.created ? 201 : 200 },
  );
}

export const PUT = POST;
