import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/lib/db';

const SYNCER_KEY = process.env.SYNCER_KEY;

export async function GET(req: NextRequest) {
  const key = req.headers.get('x-syncer-key');

  if (!key || key !== SYNCER_KEY) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const records = await db.syncRequest.findMany({
      where: status ? { status } : undefined,
      orderBy: { requestedOn: 'desc' },
    });

    return NextResponse.json({ success: true, data: records });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const key = req.headers.get('x-syncer-key');

  if (!key || key !== SYNCER_KEY) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, status, attemptOn } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'Missing id or status' }, { status: 400 });
    }

    const record = await db.syncRequest.update({
      where: { id },
      data: {
        status,
        attemptOn: attemptOn ? new Date(attemptOn) : new Date(),
      },
    });

    return NextResponse.json({ success: true, data: record });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
