import { NextResponse } from 'next/server';
import { getBuildMap } from '@/services/build';

export async function GET(_: Request, props: { params: Promise<{ siteid: string }> }) {
  const { siteid } = await props.params;
  const result = await getBuildMap(siteid);

  if (!result.success) {
    const status = result.error === 'Site not found.' ? 404 : 500;
    return NextResponse.json({ success: false, error: result.error }, { status });
  }

  return NextResponse.json(result.buildMap, { status: 200 });
}
