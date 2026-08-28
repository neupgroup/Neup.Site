import { NextRequest, NextResponse } from 'next/server';
import { prisma as db } from '#/core/database/prisma';

const SYNCER_KEY = process.env.SYNCER_KEY;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { from, to, data, key } = body;

    if (!key || key !== SYNCER_KEY) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!from || !to || !data) {
      return NextResponse.json({ success: false, error: 'Missing required fields: from, to, data' }, { status: 400 });
    }

    const record = await db.syncRequest.create({
      data: {
        source: from,
        destination: to,
        data,
      },
    });

    return NextResponse.json({ success: true, id: record.id });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
